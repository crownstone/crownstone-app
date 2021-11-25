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
import { BleCommandManager } from "./BleCommandManager";
import { Session } from "./Session";
import { Scheduler } from "../Scheduler";
import { LOG, LOGd, LOGe, LOGi } from "../../logging/Log";
import { Platform } from "react-native";

export class SessionManagerClass {

  _maxActiveSessions = Platform.OS === 'ios' ? 20 : 10;

  _sessions: {[handle: string] : Session} = {};
  _activeSessions: {[handle:string] : { connected: boolean }} = {};

  _pendingPrivateSessionRequests : {[handle: string]: {commanderId: string, resolve: () => void, reject: (err: any) => void}[]} = {};
  _pendingSessionRequests        : {[handle: string]: {commanderId: string, resolve: () => void, reject: (err: any) => void}[]} = {};

  _timeoutHandlers : {[handle: string] : {[commanderId: string]: { clearCallback: () => void }}} = {};

  _blocked = false;

  reset() {
    this._blocked = false;
    this._sessions = {};
    this._activeSessions = {};
    this._pendingPrivateSessionRequests = {};
    this._pendingSessionRequests = {};
    this._timeoutHandlers = {};
  }


  isBlocked() : boolean {
    return this._blocked;
  }

  /**
   * This will resolve once the session is connected
   * @param handle
   * @param commanderId
   * @param privateSession
   */
  async _createSession(handle: string, commanderId: string, privateSession: boolean) {
    let privateId = privateSession ? commanderId : null;
    LOGd.constellation("SessionManager: Create new session by request.", commanderId, privateId);
    this._sessions[handle] = new Session(handle, privateId, this._getInteractionModule(handle, commanderId, privateSession));
  }

  /**
   * This will resolve once the session is connected
   * A claimed session is the only allowed session when the block is enabled.
   * @param handle
   * @param commanderId
   */
  async claimSession(handle: string, commanderId: string, timeoutSeconds: number) {
    LOGi.constellation("SessionManager: Claiming session", handle, commanderId)
    if (this._blocked !== true) {
      throw new Error("SESSION_MANAGER_IS_NOT_BLOCKED");
    }
    let privateId = commanderId;
    return new Promise<void>((resolve, reject) => {
      this._addToPending(handle, commanderId, true, timeoutSeconds, resolve, reject);
      this._sessions[handle] = new Session(handle, privateId, this._getInteractionModule(handle, commanderId, true, true));
      this._sessions[handle].recoverFromDisconnect = true;
    });
  }


  /**
   * The interaction module is a messaging tool between the session and the sessionManager
   * It is used in favor of an eventbus to avoid a lot of difficult to track, untyped events between 2 modules.
   * @param handle
   * @param privateId
   * @param resolve
   * @param reject
   */
  _getInteractionModule(handle: string, commanderId: string, privateSession: boolean, claimedSession: boolean = false) : SessionInteractionModule {
    let privateId = privateSession ? commanderId : null;
    return {
      canActivate:     () => {
        if (claimedSession) {
          return Object.keys(this._activeSessions).length <= this._maxActiveSessions;
        }
        else {
          return this._blocked === false && Object.keys(this._activeSessions).length <= this._maxActiveSessions;
        }
      },
      willActivate:    () => { this._activeSessions[handle] = { connected:false }; },
      isDeactivated:   () => { delete this._activeSessions[handle]; },
      sessionHasEnded: () => { this._endSession(handle); },
      isConnected:     () => {
        // in case this session connects but it has also already been deleted.
        if (this._activeSessions[handle] === undefined) {
          LOGe.constellation("SessionManager: A session has connected while already being deleted.")
          return;
        }

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
        if (session.isPrivate()) {
          if (session.privateId === privateId) {
            // this shouldnt happen, it would be a bug if it did.
            throw new Error("PRIVATE_SESSION_SHOULD_BE_REQUESTED_ONCE_PER_COMMANDER");
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
      // This should never occur. We do not reject the promise here because this error should not be propagated to the requesting party.
      throw new Error("ALREADY_REQUESTED_TIMEOUT")
    }

    this._timeoutHandlers[handle][commanderId] = {
      clearCallback: Scheduler.scheduleCallback(() => {
        // remove the handler after it is fired.
        delete this._timeoutHandlers[handle][commanderId]

        LOG.constellation("SessionManager: SESSION_REQUEST_TIMEOUT Timeout called for ", handle, commanderId);
        reject(new Error("SESSION_REQUEST_TIMEOUT"));
        let session = this._sessions[handle];

        this.removeFromQueue(handle, commanderId);
        if (privateSessionRequest) {
          if (session && session.privateId === commanderId) {
            // this should close a session in any state and cleans it up. It will trigger a new session if there are open requests.
            this.closeSession(handle);
          }
        }
        else {
          if (session && session.isPrivate() === false) {
            // this should close a session in any state and cleans it up. It will trigger a new session if there are open requests.
            if (this._pendingSessionRequests[handle] !== undefined) {
              LOGi.constellation("SessionManager: Keep session open for other requests after timeout.");
            }
            else {
              this.closeSession(handle);
            }
          }
        }

        // fail all commands owned by this commanderId, since the timeout is a property of the commander. If one session request has
        // reached this timeout, all commands from this commander will fail.
        // A commander has a single timeout. This is not per command. Once the commander timeouts, all of it's commands will be timeout.
        BleCommandManager.cancelCommanderCommands(commanderId, "SESSION_REQUEST_TIMEOUT");
      }, timeoutSeconds*1000)
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
        // if other processes require this public session, allow them to use it instead.
        if (this.checkIfSessionIsStillRequired(handle) === false) {
          // public sessions close themselves, no need to end if it is connected
          await this.closeSession(handle);
        }
        else {
          LOGi.constellation("SessionManager: Keep session open for other requests after revoke.", handle);
        }
      }
    }

    // remove the pending request from the private list if it's there.
    if (isInList(this._pendingPrivateSessionRequests, handle, commanderId)) {
      removeFromQueueList(this._pendingPrivateSessionRequests, handle, commanderId);
    }

    // remove the timeout
    if (this._timeoutHandlers[handle][commanderId] !== undefined) {
      this._timeoutHandlers[handle][commanderId].clearCallback();
      delete this._timeoutHandlers[handle][commanderId];
    }

    // if the session is private, the revocation must close it.
    if (session && session.isPrivate() === true && session.privateId === commanderId) {
      await this.closeSession(handle);
    }
  }


  /**
   * this should close a session in any state and cleans it up.
   * It should cause the session to trigger an _endSession via the interaction module call sessionHasEnded
   * @param handle
   * @param commanderId
   */
  async closeSession(handle : string) {
    let session = this._sessions[handle];
    if (session) {
      await session.kill();
    }
  }


  /**
   * If the session is claimed via claimSession, we might want to disconnect it. This methods does this.
   * @param handle
   * @param commanderId
   */
  async disconnectSession(handle: string, commanderId: string) {
    let session = this._sessions[handle];
    if (session && session.isPrivate() && session.privateId === commanderId && session.state !== "DISCONNECTING" && session.state !== "DISCONNECTED") {
      await session.disconnect();
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
    LOGi.constellation("SessionManager: Ending session in manager", handle)
    let session = this._sessions[handle];

    delete this._sessions[handle];
    delete this._activeSessions[handle];

    // the session either had an error, it was killed, or it had nothing to do and as closed (shared session only)

    // if this is a private session, it had to be killed in order to get here. Next one in queue!
    // check if there are any private requests queued. These get priority.
    if (this._pendingPrivateSessionRequests[handle] && this._pendingPrivateSessionRequests[handle].length > 0) {
      let pendingPrivate = this._pendingPrivateSessionRequests[handle][0];
      LOGi.constellation("SessionManager: creating session after the previous session had ended for private commander.", handle, pendingPrivate.commanderId);
      this._createSession(handle, pendingPrivate.commanderId, true)
    }
    else {
      let newRequest = this.checkIfSessionIsStillRequired(handle);
      if (newRequest !== false) {
        this._createSession(handle, newRequest, false);
      }
    }
  }

  checkIfSessionIsStillRequired(handle) : string | false {
    // if it was a shared session, it could have been an error or it had nothing to do.
    if (this._pendingSessionRequests[handle] && this._pendingSessionRequests[handle].length > 0) {
      LOGi.constellation("SessionManager: creating public session after the previous session had ended because there are queued requests", handle, this._pendingSessionRequests[handle]);
      return this._pendingSessionRequests[handle][0].commanderId;
    }
    else {
      let pendingCommandId = BleCommandManager.areThereCommandsFor(handle);
      if (pendingCommandId !== null) {
        // there are still shared commands, so the session will be retried.
        LOGi.constellation("SessionManager: creating public session after the previous session had ended because there are still commands to be executed.", handle, pendingCommandId);
        return "stillRequiredForCommand_" + pendingCommandId;
      }
    }

    LOGi.constellation("SessionManager: Session is not required anymore", handle)
    return false;
  }


  /**
   * This will check all registered sessions to see if they're required.
   * It will query the BleCommandManager for all outstanding commands. If the shared ones have no commands, they're cancelled.
   */
  evaluateSessionNecessity() {
    LOGd.constellation("SessionManager: evaluateSessionNecessity now")
    for (let handle in this._sessions) {
      if (this._sessions[handle].privateId === null) {
        if (BleCommandManager.areThereCommandsFor(handle) === null && (this._pendingSessionRequests[handle] === undefined || this._pendingSessionRequests[handle].length == 0)) {
          LOGi.constellation("SessionManager: Killing session", handle)
          this._sessions[handle].kill();
        }
      }
    }
  }




  async removeFromQueue(handle, commanderId) {
    removeFromQueueList(this._pendingPrivateSessionRequests, handle, commanderId);
    removeFromQueueList(this._pendingSessionRequests, handle, commanderId);
  }

  async intiateBlock() : Promise<void> {
    this._blocked = true;

    let privateSessionsPresent = true;
    let timeWaitedMs = 0;
    let stepMs = 250;

    // here we wait for a max of 1 minute for any private sessions to close.
    // new sessions cannot be started due to the _blocked boolean.

    LOGi.constellation("IntiatingBlock: Initiating block. Waiting for sessions to expire.");
    while (privateSessionsPresent && timeWaitedMs < 60000) {
      privateSessionsPresent = false;
      for (let handle in this._activeSessions) {
        LOGd.constellation("IntiatingBlock: Active session found", handle);
        let session = this._sessions[handle];
        if (session && session.isPrivate()) {
          privateSessionsPresent = true;
        }
      }

      LOGd.constellation("IntiatingBlock: privateSessionsPresent", privateSessionsPresent, timeWaitedMs);
      if (privateSessionsPresent != false) {
        await Scheduler.delay(stepMs);
      }
      timeWaitedMs += stepMs;
    }

    // now we close any remaining active session.
    LOGi.constellation("InitiatingBlock: Closing active sessions.", this._activeSessions);
    for (let handle in this._activeSessions) {
      LOGi.constellation("IntiatingBlock: Closing Session...", handle)
      await this.closeSession(handle);
      LOGi.constellation("IntiatingBlock: Closed Session.", handle)
    }

    // since we wait for disconnect events from the bluetooth stack, we wait for all active sessions to automatically be deactivated.

    timeWaitedMs = 0;
    // by allowing the wait to be 20 seconds, we ensure that all connections are over.
    // The only exception here being DFU. That is why we first wait for all private connections to end by themselves.
    while (Object.keys(this._activeSessions).length > 0 && timeWaitedMs < 20000) {
      LOGd.constellation("InitiatingBlock, waiting for sessions to close.", this._activeSessions, Object.keys(this._activeSessions))
      await Scheduler.delay(stepMs);
      timeWaitedMs += stepMs;
    }

    // if any are stuck for whatever reason, we manually clean them up.
    LOGi.constellation("InitiatingBlock: Awaiting the forced ending of the active sessions.", this._activeSessions);
    for (let handle in this._activeSessions) {
      LOGi.constellation("IntiatingBlock: Forcing end of Session...", handle)
      await this._sessions[handle].sessionHasEnded();
      LOGi.constellation("IntiatingBlock: Session ended.", handle)
    }

    this._activeSessions = {};
    LOGi.constellation("InitiatingBlock: Finished.")
  }

  releaseBlock() {
    this._blocked = false;
  }

}

function addToPendingList(map, handle, commanderId, resolve, reject) {
  if (map[handle] === undefined) {
    map[handle] = [];
  }
  for (let sessionRequest of map[handle]) {
    if (sessionRequest.commanderId === commanderId) {
      throw new Error("ALREADY_REQUESTED");
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
      arrayInMap[i].reject(new Error("REMOVED_FROM_QUEUE"));
      arrayInMap.splice(i,1);
      break;
    }
  }

  // sessionEnded
  if (arrayInMap.length == 0) {
    delete map[handle];
  }
}


export const SessionManager = new SessionManagerClass();
