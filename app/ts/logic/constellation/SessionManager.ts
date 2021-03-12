/**
 * This class should manage "Sessions". Sessions are connections to Crownstones. This class will keep track of connection requests
 * to certain Crownstones.
 *
 * Any part of the app can request a slot. Sessions may be dedicated (no other commands are inserted in the slot request), or open.
 *
 * This class will also be able to block Session requests for a certain time, and queue them. This will be used for DFU for instance.
 * It will be able to force a clear slate (cancel all pending connections, fail their promises) in order to quickly provide full BLE control,
 * which will be required for DFU.
 *
 * The slot manager will determine when to terminate a slot based on how many users a slot has.
 */
import { xUtil } from "../../util/StandAloneUtil";
import { BleCommandManager } from "./BleCommandManager";
import { Session } from "./Session";
import { Scheduler } from "../Scheduler";
import { LOG } from "../../logging/Log";

export class SessionManagerClass {

  _maxActiveSessions = 1000;

  _sessions: {[handle: string] : Session} = {};
  _activeSessions: {[handle:string] : { connected: boolean }} = {};

  _pendingPrivateSessionRequests : {[handle: string]: {commanderId: string, resolve: () => void, reject: (err: any) => void}[]} = {};
  _pendingSessionRequests        : {[handle: string]: {commanderId: string, resolve: () => void, reject: (err: any) => void}[]} = {};

  _timeoutHandlers : {[handle: string] : {[commanderId: string]: { clearCallback: () => void }}} = {};

  reset() {
    this._sessions = {};
    this._activeSessions = {};
    this._pendingPrivateSessionRequests = {};
    this._pendingSessionRequests = {};
    this._timeoutHandlers = {};

  }

  /**
   * This will resolve once the session is connected
   * @param handle
   * @param privateId
   */
  async _createSession(handle: string, commanderId: string, privateSession: boolean) {
    let privateId = privateSession ? commanderId : null;
    this._sessions[handle] = new Session(handle, privateId, this._getInteractionModule(handle, commanderId, privateSession));
  }


  /**
   * The interaction module is a messaging tool between the session and the sessionManager
   * It is used in favor of an eventbus to avoid a lot of difficult to track, untyped events between 2 modules.
   * @param handle
   * @param privateId
   * @param resolve
   * @param reject
   */
  _getInteractionModule(handle: string, commanderId: string, privateSession: boolean) : SessionInteractionModule {
    let privateId = privateSession ? commanderId : null;
    return {
      canActivate:     () => { return Object.keys(this._activeSessions).length <= this._maxActiveSessions },
      willActivate:    () => { this._activeSessions[handle] = { connected:false }; },
      isDeactivated:   () => { delete this._activeSessions[handle]; },
      sessionHasEnded: () => { this._endSession(handle); },
      isConnected:     () => {
        // remove the timeout listener for this session.
        if (this._activeSessions[handle].connected === false) {
          // resolve the createSession
          this._activeSessions[handle].connected = true;

          // the session is now connected. We clear the timeout on the requesting commander to start with.
          // this will take care of the private session timeout. The shared one will be handled below.
          if (this._timeoutHandlers[handle] && this._timeoutHandlers[handle][commanderId]) {
            this._timeoutHandlers[handle][commanderId].clearCallback();
            delete this._timeoutHandlers[handle][commanderId];
          }

          // if this is a shared connection, fulfill all shared queued promises.
          if (privateSession === false && this._pendingSessionRequests[handle]) {
            for (let pendingSession of this._pendingSessionRequests[handle]) {
              // remove the timeout handler for the shared request.
              if (this._timeoutHandlers[handle] && this._timeoutHandlers[handle][pendingSession.commanderId]) {
                this._timeoutHandlers[handle][pendingSession.commanderId].clearCallback();
                delete this._timeoutHandlers[handle][pendingSession.commanderId];
              }
              pendingSession.resolve();
            }
            delete this._pendingSessionRequests[handle];
          }
          else if (privateSession === true && this._pendingPrivateSessionRequests[handle]) {
            // if this is a private connection, resolve the private pending request with the matching privateId
            for (let i = 0; i < this._pendingPrivateSessionRequests[handle].length; i++) {
              let pendingSession = this._pendingPrivateSessionRequests[handle][i];
              if (pendingSession.commanderId === commanderId) {
                pendingSession.resolve();
                this._pendingPrivateSessionRequests[handle].splice(i, 1);
                if (this._pendingPrivateSessionRequests[handle].length === 0) {
                  delete this._pendingPrivateSessionRequests[handle];
                }
                break;
              }
            }
          }
        }
      }
    }
  }


  /**
   * This will check all registered sessions to see if they're required.
   * It will query the BleCommandManager for all outstanding sessions. If the shared ones have no commands, they're cancelled.
   */
  evaluateSessionNecessity() {
    for (let handle in this._sessions) {
      if (this._sessions[handle].privateId === null) {
        if (BleCommandManager.areThereCommandsFor(handle) === false && (this._pendingSessionRequests[handle] === undefined || this._pendingSessionRequests[handle].length == 0)) {
          this._sessions[handle].kill();
        }
      }
    }
  }



  /**
   * The result of this call should be an established connection.
   *
   * @param handle
   * @param commanderId
   * @param privateSessionRequest
   * @param timeoutSeconds
   */
  async request(handle, commanderId : string, privateSessionRequest: boolean, timeoutSeconds?: number) : Promise<void> {
    // TODO: make sure a private connection is more important than a shared one.
    if (privateSessionRequest && !timeoutSeconds) {
      timeoutSeconds = 20;
    }
    else if (!timeoutSeconds) {
      timeoutSeconds = 300;
    }

    let privateId = privateSessionRequest ? commanderId : null;
    let session = this._sessions[handle];

    // each registration should get its own timeout handler.
    return new Promise<void>((resolve, reject) => {
      /**
       IF the session DOES exist, there are 2 cases
       - the session is connected.
       - the session is private
       - queue the new request to be performed after the private session is over

       - the session is shared
       - the session is not connected yet.
       - the session is private
       - the session is shared
       */

      // The reject should be able to be executed on a close, AND after a timeout.
      // This is assuming that the resolve is not done before that.

      // IF the session does NOT exist yet, we can create the session.
      if (!session) {
        this._createSession(handle, commanderId, privateSessionRequest);
        // the request will be added to pending below;
      }
      else {
        // If the session is private, you cannot re-request it even with the same commanderId.
        // It has to be ended first.
        // TODO: test
        if (session.isPrivate()) {
          if (session.privateId === privateId) {
            // this shouldnt happen, it would be a bug if it did.
            throw "PRIVATE_SESSION_SHOULD_BE_REQUESTED_ONCE_PER_COMMANDER";
          }
          // the request will be added to pending below;
        }
        else {
          // the existing session is a shared session.
          // If the incoming request is private:
          //   - queue
          // If the incoming request is shared too:
          //   - if the session is connected, resolve
          //   - if the session is not connected yet, queue
          if (privateSessionRequest) {
            // the request will be added to pending below;
          }
          else {
            // Add this to the queue in order to resolve the promises consistently.
            // If it is already connected, resolve immediately.
            if (this._sessions[handle].isConnected() === false) {
              // the request will be added to pending below;
            }
            else {
              return resolve();
            }
          }
        }
      }
      this._addToPending(handle, commanderId, privateSessionRequest, timeoutSeconds, resolve, reject);
    })
  }


  _addToPending(
    handle:                string,
    commanderId:           string,
    privateSessionRequest: boolean,
    timeoutSeconds:        number,
    resolve:               () => void,
    reject:                (err: any) => void
  ) {

    if (privateSessionRequest) {
      LOG.constellation("SessionManager: Adding request to private pending list.", handle, commanderId);
      addToPendingList(this._pendingPrivateSessionRequests, handle, commanderId, resolve, reject);
    }
    else {
      LOG.constellation("SessionManager: Adding request to shared pending list.", handle, commanderId);
      addToPendingList(this._pendingSessionRequests, handle, commanderId, resolve, reject);
    }

    this._scheduleTimeoutHandler(handle, commanderId, privateSessionRequest, timeoutSeconds, reject);
    // The timeout will be cleared when the corresponding session is connected.
  }


  _scheduleTimeoutHandler(handle : string, commanderId: string, privateSessionRequest: boolean, timeoutSeconds: number, reject: (err: any) => void) {
    if (this._timeoutHandlers[handle] === undefined) {
      this._timeoutHandlers[handle] = {};
    }

    if (this._timeoutHandlers[handle][commanderId] !== undefined) {
      throw "ALREADY_REQUESTED"
    }

    this._timeoutHandlers[handle][commanderId] = {
      clearCallback: Scheduler.scheduleCallback(() => {
        LOG.constellation("SessionManager: TIMEOUT! Timeout called for ", handle, commanderId)
        reject("SESSION_REQUEST_TIMEOUT");
        let session = this._sessions[handle];

        this.removeFromQueue(handle, commanderId);
        if (privateSessionRequest) {
          if (session && session.privateId === commanderId) {
            // this should close a session in any state and cleans it up. It will trigger a new session if there are open requests.
            this.closeSession(handle, commanderId);
          }

          // fail all commands owned by this commanderId
          BleCommandManager.cancelCommanderCommands(commanderId);
        }
        else {
          if (session && session.isPrivate() === false && this._pendingSessionRequests[handle] === undefined) {
            // this should close a session in any state and cleans it up. It will trigger a new session if there are open requests.
            this.closeSession(handle, commanderId);
          }
        }
      })
    };
  }


  /**
   * This can be used to revoke an outstanding request.
   * @param handle
   * @param commanderId
   */
  async revokeRequest(handle: string, commanderId: string) {
    let session = this._sessions[handle];

    // if it was in the public list, remove it from there.
    if (isInList(this._pendingSessionRequests, handle, commanderId)) {
      removeFromQueueList(this._pendingSessionRequests, handle, commanderId);
      if (session && session.isPrivate() === false && session.state === "INITIALIZING" || session.state === "CONNECTING") {
        // public sessions close themselves, no need to end if it is connected
        await this.closeSession(handle, commanderId);
      }
    }

    // remove the pending request from the private list if it's there.
    if (isInList(this._pendingPrivateSessionRequests, handle, commanderId)) {
      removeFromQueueList(this._pendingPrivateSessionRequests, handle, commanderId);
    }

    // if the session is private, the revocation must close it.
    if (session && session.isPrivate() === true && session.privateId === commanderId) {
      await this.closeSession(handle, commanderId);
    }
  }


  /**
   * this should close a session in any state and cleans it up.
   * It should cause the session to trigger an _endSession via the interaction module call sessionHasEnded
   * @param handle
   * @param commanderId
   */
  async closeSession(handle : string, commanderId : string) {
    let session = this._sessions[handle];
    if (session) {
      await session.kill();
    }
  }

  /**
   * The end of a session means it has disconnected after being connected once, or it has been killed.
   *
   * It will trigger a new session if there are open requests.
   *
   * Becoming active means it will initiate a connection request to the lib.
   *
   * @param handle
   */
  async _endSession(handle) {
    let session = this._sessions[handle];

    delete this._sessions[handle];
    delete this._activeSessions[handle];

    // the session either had an error, it was killed, or it had nothing to do and as closed (shared session only)

    // if this is a private session, it had to be killed in order to get here. Next one in queue!
    // check if there are any private requests queued. These get priority.
    if (this._pendingPrivateSessionRequests[handle] && this._pendingPrivateSessionRequests[handle].length > 0) {
      let pendingPrivate = this._pendingPrivateSessionRequests[handle][0];
      this._createSession(handle, pendingPrivate.commanderId, true)
    }
    else {
      // if it was a shared session, it could have been an error or it had nothing to do.
      if (BleCommandManager.areThereCommandsFor(handle) === true || (this._pendingSessionRequests[handle] && this._pendingSessionRequests[handle].length > 0)) {
        // there are still shared commands, so the session will be retried.
        await this.request(handle, xUtil.getUUID(), false);
      }
    }
  }

  async removeFromQueue(handle, commanderId) {
    removeFromQueueList(this._pendingPrivateSessionRequests, handle, commanderId);
    removeFromQueueList(this._pendingSessionRequests, handle, commanderId);
  }

  clearAllSessions() {
    // TODO: implement.
  }
}

function addToPendingList(map, handle, commanderId, resolve, reject) {
  if (map[handle] === undefined) {
    map[handle] = [];
  }
  for (let sessionRequest of map[handle]) {
    if (sessionRequest.commanderId === commanderId) {
      throw "ALREADY_REQUESTED";
    }
  }
  map[handle].push({commanderId, resolve, reject})
}


function isInList(map, handle, commanderId) {
  let arrayInMap = map[handle];
  if (!arrayInMap) { return false; }

  for (let i = 0; i < arrayInMap.length; i++) {
    if (arrayInMap[i].commanderId === commanderId) {
      return true;
    }
  }

  return false;
}

function removeFromQueueList(map, handle, commanderId) {
  let arrayInMap = map[handle];
  if (!arrayInMap) { return; }

  for (let i = 0; i < arrayInMap.length; i++) {
    if (arrayInMap[i].commanderId === commanderId) {
      arrayInMap[i].reject("REMOVED_FROM_QUEUE");
      arrayInMap.splice(i,1);
      break;
    }
  }

  // sessionEnded
  if (arrayInMap.length == 0) {
    delete map[handle];
  }
}


export const SessionManager = new SessionManagerClass()