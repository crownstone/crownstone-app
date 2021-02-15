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
import { BleCommandQueue } from "./BleCommandQueue";
import { Session } from "./Session";
import { Scheduler } from "../Scheduler";

export class SessionManagerClass {

  _maxActiveSessions = 1000;


  _sessions: {[handle: string] : Session} = {};
  _activeSessions: {[handle:string] : { connected: boolean }} = {};

  _registeredSessions: {[handle:string] : { private: boolean, privateId: string | null, counter: number }} = {};

  _pendingPrivateSessionRequests : {[handle: string]: {commandId: string, resolve: () => void, reject: (err: any) => void}[]}
  _pendingSessionRequests        : {[handle: string]: {commandId: string, resolve: () => void, reject: (err: any) => void}[]}

  _timeoutHandlers : {[handle: string] : { clearCallback: () => void }} = {};

  /**
   * This will resolve once the session is connected
   * @param handle
   * @param privateId
   */
  async _createSession(handle: string, privateId: string | null = null) {
    return new Promise<void>((resolve, reject) => {
      this._sessions[handle] = new Session(
        handle,
        privateId,
        this._getInteractionModule(handle, privateId, resolve, reject)
      );
    })
  }

  /**
   * This will check all registered sessions to see if they're required.
   * It will query the BleCommandQueue for all outstanding sessions. If the shared ones have no commands, they're cancelled.
   */
  evaluateSessionNecessity() {
    for (let handle in this._sessions) {
      if (this._sessions[handle].privateId === null) {
        if (BleCommandQueue.areThereCommandsFor(handle) === false) {
          this.cleanSession(handle);
        }
      }
    }
  }

  /**
   * The interaction module is a messaging tool between the session and the sessionManager
   * It is used in favor of an eventbus to avoid a lot of difficult to track, untyped events between 2 modules.
   * @param handle
   * @param privateId
   * @param resolve
   * @param reject
   */
  _getInteractionModule(handle: string, privateId: string | null, resolve: () => void, reject: (err: any) => void) : SessionInteractionModule {
    return {
      canActivate:    () => { return Object.keys(this._activeSessions).length <= this._maxActiveSessions },
      willActivate:   () => { this._activeSessions[handle] = { connected:false }; },
      isDeactivated:  () => { delete this._activeSessions[handle]; },
      cleanup:        () => { this.cleanSession(handle); },
      isConnected:    () => {
        // remove the timeout listener for this session.
        if (this._timeoutHandlers[handle]) { this._timeoutHandlers[handle].clearCallback(); }
        delete this._sessions[handle];

        if (this._activeSessions[handle].connected === false) {
          // resolve the createSession
          this._activeSessions[handle].connected = true;
          resolve();

          // if this is a shared connection, fulfill all shared queued promises.
          if (privateId === null && this._pendingSessionRequests[handle]) {
            for (let pendingSession of this._pendingSessionRequests[handle]) {
              pendingSession.resolve();
            }
            this._pendingSessionRequests[handle] = [];
          }
        }
      },
      connectionFailed: (err) => {
        if (this._activeSessions[handle].connected === false) {
          // reject the create session
          this._activeSessions[handle].connected = true;
          reject(err);
        }
      }
    }
  }

  async cleanSession(handle) {
    delete this._activeSessions[handle];
    delete this._registeredSessions[handle];
    delete this._sessions[handle];
    if (this._timeoutHandlers[handle]) { this._timeoutHandlers[handle].clearCallback(); }
    delete this._sessions[handle];

    let pendingPrivateRequests = this._pendingPrivateSessionRequests[handle];
    if (pendingPrivateRequests && pendingPrivateRequests.length > 0) {
      let pending = pendingPrivateRequests[0];
      pendingPrivateRequests.shift();
      try {
        await this.request(handle, pending.commandId, true);
      }
      catch (e) {
        pending.reject(e);
        return;
      }
      // this is not in the try catch, since any errors on the resolve should not be handled here.
      pending.resolve();
      return;
    }

    if (BleCommandQueue.areThereCommandsFor(handle) || (this._pendingSessionRequests[handle] && this._pendingSessionRequests[handle].length > 0)) {
      await this.request(handle, xUtil.getUUID(), false);
    }
  }


  /**
   * The result of this call should be an established connection.
   *
   * @param handle
   * @param commanderId
   * @param privateSession
   * @param timeoutSeconds
   */
  async request(handle, commanderId : string, privateSession: boolean, timeoutSeconds: number = 300) : Promise<void> {
    // TODO: make sure a private connection is more important than a shared one.
    let privateId = privateSession ? commanderId : null;

    let registration = this._registeredSessions[handle];
    let session = this._sessions[handle];

    // nobody is using this session. The registration is ours!
    if (!registration || registration.counter === 0) {
      this._registeredSessions[handle] = { private: privateSession, privateId: privateId, counter: 1 };
      this._scheduleTimeoutHandler(handle, commanderId, timeoutSeconds);
      return this._createSession(handle, privateId);
    }
    else if (session === undefined) {
      // Sanity check for debugging purposes.
      throw "SESSION_SHOULD_EXIST_HERE!"
    }
    else if (session.isClosing()) {
      return this.queue(handle, commanderId, privateSession)
    }

    // someone registered a privateSession session on this.
    if (registration.private && registration.counter > 0) {
      if (commanderId !== null && registration.privateId === commanderId) {
        // Your privateSession session already exists. Feel free to toss your commands in the queue!
        return
      }
      else {
        return this.queue(handle, commanderId, privateSession);
      }
    }
    else {
      // The Session already exists. Register our interest and feel free to toss your commands in the queue
      registration.counter += 1;

      // Add this to the queue in order to resolve the promises consistently.
      // If it is already connected, resolve immediately.
      if (this._sessions[handle].isConnected() === false) {
        return this.queue(handle, commanderId, privateSession);
      }
    }
  }


  _scheduleTimeoutHandler(handle : string, commanderId: string, timeoutSeconds: number) {
    if (this._timeoutHandlers[handle]) {
      this._timeoutHandlers[handle].clearCallback()
    }

    this._timeoutHandlers[handle] = { clearCallback: Scheduler.scheduleCallback(() => { this.closeSession(handle, commanderId); })};
  }


  async queue(handle, commandId: string, privateSession: boolean) : Promise<void> {
    return new Promise((resolve, reject) => {
      if (privateSession) {
        addToQueueList(this._pendingPrivateSessionRequests, handle, commandId, resolve, reject);
      }
      else {
        addToQueueList(this._pendingSessionRequests, handle, commandId, resolve, reject);
      }
    })
  }


  /**
   * This method should cancel pending connections, and if the session is private, kill the session
   * @param handle
   * @param commanderId
   */
  closeSession(handle : string, commanderId : string) {
    let registration = this._registeredSessions[handle];
    let session = this._sessions[handle];

    if (!registration && !session) { return; }
    if (!registration && session)  { session.kill(); }
    if (!session) { throw 'SESSION_SHOULD_EXIST_HERE' }

    if (registration.private) {
      if (session.privateId === commanderId) {
        return session.kill();
      }
      else {
        return this.removeFromQueue(handle, commanderId);
      }
    }

    // shared registrations;
    registration.counter -= 1;

    // if we are the last to close our session, we actually close it.
    if (registration.counter === 0) {
      session.kill();
      delete this._registeredSessions[handle]
    }
  }

  async removeFromQueue(handle, commandId) {
    removeFromQueueList(this._pendingPrivateSessionRequests, handle, commandId);
    removeFromQueueList(this._pendingSessionRequests, handle, commandId);
  }

  clearAllSessions() {
    // TODO: implement.
  }
}

function addToQueueList(map, handle, commandId, resolve, reject) {
  if (map[handle] === undefined) {
    map[handle] = [];
  }
  for (let sessionRequest of map[handle]) {
    if (sessionRequest.commandId === commandId) {
      throw "ALREADY_QUEUED";
    }
  }
  map[handle].push({commandId, resolve, reject})
}

function removeFromQueueList(map, handle, commandId) {
  let arrayInMap = map[handle];
  if (!arrayInMap) { return; }

  for (let i = 0; i < arrayInMap.length; i++) {
    if (arrayInMap[i].commandId === commandId) {
      arrayInMap[i].reject("REMOVED_FROM_QUEUE");

      arrayInMap.splice(i,1);
      break;
    }
  }

  // cleanup
  if (arrayInMap.length == 0) {
    delete map[handle];
  }
}


export const SessionManager = new SessionManagerClass()