/**
 * A Session is a connection that is requested by a part of the app. It is pending or connected, and it will request
 * commands from the queue on completion.
 *
 * It will handle keep-open connections via no-ops and it will disconnect when required using a disconnect
 * command and/or direct disconnect.
 */

import {NativeBus} from "../../native/libInterface/NativeBus";
import {BluenetPromiseWrapper} from "../../native/libInterface/BluenetPromise";
import {BleCommandManager} from "./BleCommandManager";
import {core} from "../../Core";
import {Platform} from "react-native";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {xUtil} from "../../util/StandAloneUtil";
import {LOGd, LOGe, LOGi, LOGv} from "../../logging/Log";
import {Scheduler} from "../Scheduler";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import {TemporaryHandleMap} from "./TemporaryHandleMap";

const CONNECTION_THRESHOLD_MIN  = Platform.OS === 'ios' ? -73 : -73;
const CONNECTION_THRESHOLD_STEP = Platform.OS === 'ios' ? -3  : -3;
const CONNECTION_THRESHOLD_MAX  = Platform.OS === 'ios' ? -85 : -85;
const HISTORICAL_THRESHOLD      = Platform.OS === 'ios' ? -75 : -75;

export class Session {
  state    : ConnectionState = "INITIALIZING"
  handle   : string
  sphereId : string

  identifier = xUtil.getShortUUID()

  _sessionIsActivated = false;
  _sessionIsKilled = false;
  _sessionHasEnded = false;

  _pendingForClose = [];

  privateId : string | null;
  listeners = [];

  _unsubscribeBootstrappers = []

  crownstoneMode : CrownstoneMode;
  interactionModule: SessionInteractionModule;

  _weakRSSImeasurements = 0;

  recoverFromDisconnect = false;

  constructor(handle: string, privateId: string | null, interactionModule : SessionInteractionModule) {
    this.handle = handle;
    this.interactionModule = interactionModule;
    this.privateId = privateId || null;
    this.sphereId  = MapProvider.stoneHandleMap[handle]?.sphereId || TemporaryHandleMap.get(handle) || null;

    LOGi.constellation("Session: Creating session", this.handle, this.identifier);

    this._respondTo(NativeBus.topics.disconnectedFromPeripheral, () => {
      this._handleDisconnectedState();
    });

    this.initializeBootstrapper();

    // if we know we were very close recently, immediately try to activate.
    // This is an optimization for public sessions only since private sessions already immediately try to activate.
    if (!this.privateId) {
      let historicalRSSI = StoneAvailabilityTracker.getHandleAvgRssi(this.handle);
      if (historicalRSSI >= HISTORICAL_THRESHOLD) {
        this.tryToActivate(HISTORICAL_THRESHOLD, historicalRSSI);
      }
    }

    if (this.privateId) {
      this.listeners.push(core.eventBus.on(`CommandLoaded_${this.privateId}`, async () => {
        if (this.state === "DISCONNECTED" && this.recoverFromDisconnect && this._isSessionActive()) {
          this.initializeBootstrapper();
          this.tryToActivate();
          return;
        }

        if (this.state === "WAITING_FOR_COMMANDS") {
          // we do this next tick to ensure all the loading processes are finished.
          // I don't want it to matter too much when the commandloaded is called compared to when the actual command
          // is loaded. This solves that issue.
          await xUtil.nextTick();
          await this.handleCommands();
        }
      }));
      this.tryToActivate();
    }
  }


  _handleDisconnectedState() {
    // if we're attempting to setup a connection and disconnect before the connect promise is resolved, the connect promise should fail.
    // this means that we should not end the session as we'll enter the reconnect phase in the error handling of the connect promise.
    if (this.state === "CONNECTING") {
      LOGi.constellation("Session: Disconnect event before connect finished", this.handle, this.identifier, this._sessionIsKilled, this._sessionHasEnded);
      this.state = "DISCONNECTED";
      return;
    }

    this.state = "DISCONNECTED";
    LOGi.constellation("Session: _handleDisconnectedState", this.recoverFromDisconnect, this._isSessionActive());
    if (this.recoverFromDisconnect && this._isSessionActive() ) {
      LOGi.constellation("Session: Disconnected from Crownstone, Ready for reconnect...", this.handle, this.identifier);
    }
    else {
      LOGi.constellation("Session: Disconnected from Crownstone, ending session...", this.handle, this.identifier)
      this.sessionHasEnded();
    }
  }


  initializeBootstrapper() {
    LOGi.constellation("Session: Initializing bootstrapper", this.handle, this.identifier);
    this.state = "INITIALIZING";
    this._sessionIsActivated = false;
    this._weakRSSImeasurements = 0;

    this._clearBootstrapper();

    let activator = (data : crownstoneBaseAdvertisement) => {
      if (data.handle === this.handle) {
        if (this._sessionIsActivated === false) {
          let threshold = Math.max(CONNECTION_THRESHOLD_MAX, CONNECTION_THRESHOLD_MIN + this._weakRSSImeasurements*CONNECTION_THRESHOLD_STEP);
          if (data.rssi >= threshold) {
            this.tryToActivate(threshold, data.rssi);
          }
          else {
            this._weakRSSImeasurements += 1;
          }
        }
      }
    }

    // we use either a setup advertisement or a dfu advertisement in case this is not a
    this._unsubscribeBootstrappers.push(NativeBus.on(NativeBus.topics.crownstoneAdvertisementReceived, activator));
    this._unsubscribeBootstrappers.push(core.eventBus.on("iBeaconOfValidCrownstone", activator));
  }


  _clearBootstrapper() {
    LOGv.constellation("Session: Clearing bootstrapper", this.handle, this.identifier);
    for (let unsubscribe of this._unsubscribeBootstrappers) {
      unsubscribe();
    }
    this._unsubscribeBootstrappers = [];
  }


  /**
   * Each incoming scan which is close enough will try to activate the session.
   * The session asks the sessionManager if it is allowed to start.
   * If the SessionManager agrees, it will activate and start connecting.
   *
   * The threshold and measurement are only provided for logging purposes.
   * @param threshold
   * @param measurement
   */
  async tryToActivate(threshold? : number, measurement? : number) {
    if (this.state !== "INITIALIZING") { return; }

    if (this.interactionModule.canActivate()) {
      if (measurement) {
        LOGd.constellation(`Session: Passed activation check with ${measurement} threshold ${threshold}`, this.handle, this.identifier);
      }
      else {
        LOGd.constellation(`Session: Passed activation check with privateId ${this.privateId}`, this.handle, this.identifier);
      }
      await this.connect();
    }
  }


  _respondTo(event : string, callback: () => void) {
    this.listeners.push(NativeBus.on(event,(handle) => {
      if (handle === this.handle) { callback(); }
    }));
  }


  isPrivate()   : boolean { return this.privateId !== null;        }
  isClosing()   : boolean { return this.state === "DISCONNECTING"; }
  isConnected() : boolean {
    // these are all states where the Session is available for commands and connected.
    switch (this.state) {
      case "CONNECTED":
      case "WAITING_FOR_COMMANDS":
      case "PERFORMING_COMMAND":
        return true;
    }
    return false;
  }


  async connect() {
    LOGi.constellation("Session: Start connecting to", this.handle, this.identifier);
    // remove the listener for ibeacons from this device.
    this._clearBootstrapper()

    this.interactionModule.willActivate();
    this._sessionIsActivated = true;
    this.state = "CONNECTING";
    try {
      this.crownstoneMode = await BluenetPromiseWrapper.connect(this.handle, this.sphereId, this.privateId !== null);
    }
    catch (err) {
      LOGi.constellation("Session: Failed to connect", err?.message, this.handle, this.identifier, this._sessionIsKilled, this._sessionHasEnded);
      this.interactionModule.isDeactivated();

      if (!this._isSessionActive()) {
        // the session will be ended once the cancelConnectionRequest has finished.
        return;
      }

      // a failed connection will automatically retry until the session is ended.
      LOGi.constellation("Session: Reinitializing the bootstrapper to reactivate the session", this.handle, this. identifier);
      this.initializeBootstrapper();
      return;
    }

    // Setting up the connection is a multi-stage process. It connects, gets the services, gets the session nonce etc.
    // It should not happen that a disconnect event is thrown during this process. At that point, the connection process for this session failed.
    // @ts-ignore
    if (this.state === "DISCONNECTED") {
      LOGe.constellation("Session: Disconnected before connect finished", this.handle, this.identifier, this._sessionIsKilled, this._sessionHasEnded);
      return;
    }

    LOGi.constellation("Session: Connected to", this.handle, this.identifier);
    this.state = "CONNECTED";
    this.interactionModule.isConnected();

    // on the next tick we check for commands.
    // This is done to allow for chaining commands in after the connect has succeeded.
    await xUtil.nextTick()
    await this.handleCommands();
  }


  async handleCommands() {
    let availableCommandId = BleCommandManager.areThereCommandsFor(this.handle, this.privateId);

    if (availableCommandId === null) {
      // there is no task for us to do. If we're a private connection, we'll wait patiently for a new command
      if (this.isPrivate()) {
        // Tasks here CAN include connections.
        this.state = "WAITING_FOR_COMMANDS";
        return;
      }
      else {
        // this means that we're done.
        await this.disconnect();
        // delete is handled by the disconnect event.
        return;
      }
    }
    this.state = "PERFORMING_COMMAND";
    LOGi.constellation("Session: performing available command...", availableCommandId, this.handle, this.identifier);

    try {
      let performedCommandId = await BleCommandManager.performCommand(this.handle, this.privateId);
      LOGi.constellation("Session: Finished available command.", performedCommandId, this.handle, this.identifier);
    }
    catch(err) {
      LOGi.constellation("Session: Failed to perform command.", availableCommandId, this.handle, this.identifier, err?.message);
      if (err?.message === "NOT_CONNECTED") {
        LOGe.constellation("Session: Race condition detected while performing command.", availableCommandId, this.handle, this.identifier, err?.message);
        // there is a mismatch between the lib and session state. If this was a claimed session, we can reconnect later on a new command.
        // if it was a public session, the session was already ended and this cycle should be broken right here.
        this.state = "DISCONNECTED";
        this._handleDisconnectedState();
        return;
      }
    }
    // @ts-ignore
    if (this.state !== "PERFORMING_COMMAND") {
      LOGi.constellation("Session: Session interrupted", this.handle, this.identifier);
      return;
    }
    this.state = "CONNECTED";

    if (this._sessionIsKilled) {
      return this.disconnect();
    }

    // We do this on the next tick to allow for chaining new commands after this one has been resolved.
    await xUtil.nextTick();
    await this.handleCommands();
  }

  waitForDisconnect() : Promise<void> {
    return new Promise((resolve, reject) => { this._pendingForClose.push(resolve) });
  }

  /**
   * This will be called when the SessionManager closes this session.
   */
  async kill() {
    // session already ended. return/
    if (this._sessionHasEnded) { return; }

    // kill already in progress. resolve on end.
    if (this._sessionIsKilled) { return new Promise((resolve, reject) => { this._pendingForClose.push(resolve) }); }

    LOGi.constellation("Session: killing session requested...",this.state, this.handle, this.identifier);
    this._sessionIsKilled = true;
    switch (this.state) {
      case "INITIALIZING":
        this.sessionHasEnded();
        break;
      case "CONNECTING":
        await BluenetPromiseWrapper.cancelConnectionRequest(this.handle).catch((err) => {
          LOGe.constellation("Session: Error when cancellingConnectionRequest", err?.message);
        })
        LOGd.constellation("Session: cancelConnectionRequest finished, ending session", this.handle, this.identifier);
        this.sessionHasEnded();
        break;
      case "CONNECTED":
        await this.disconnect();
        break;
      case "PERFORMING_COMMAND":
        // wait for the command to finish.
        LOGd.constellation("Session: waiting for command to finish...",this.state, this.handle, this.identifier)
        await Scheduler.delay(100);
        return;
      case "WAITING_FOR_COMMANDS":
        await this.disconnect();
        break;
      case "DISCONNECTING":
        // the session will be cleared by the disconnected event listener
        break;
      case "DISCONNECTED":
        this.sessionHasEnded();
        break;
    }


    LOGi.constellation("Session: killing session completed", this.handle, this.identifier);
  }


  async disconnect() {
    LOGi.constellation("Session: performing closing commands...", this.handle, this.identifier);
    this.state = "DISCONNECTING";
    try {
      await BleCommandManager.performClosingCommands(this.handle, this.privateId, this.crownstoneMode);
    }
    catch (e) {
      LOGd.constellation("Session: failed performing closing commands", this.handle, this.identifier, e?.message);
    }

    LOGi.constellation("Session: closing commands done.", this.handle, this.identifier);
    if (this.crownstoneMode === "operation") {
      // tell the crownstone to disconnect from the phone.
      LOGi.constellation("Session: telling the Crownstone to disconnect...", this.handle, this.identifier);
      await BluenetPromiseWrapper.disconnectCommand(this.handle);
    }
    else {
      LOGi.constellation("Session: disconnecting from phone...", this.handle, this.identifier);
      await BluenetPromiseWrapper.phoneDisconnect(this.handle);
    }

    LOGi.constellation("Session: disconnect done", this.handle, this.identifier);
  }


  deactivate() {
    if (this.isPrivate() || this.isClosing()) { return; }
    if (this._sessionIsActivated === false)   { return; }
    if (this.state === "CONNECTED")           { return; }
    if (this.state === "CONNECTING") {
      BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
      this.interactionModule.isDeactivated();
    }

    this.initializeBootstrapper();
  }


  async sessionHasEnded() {
    if (this._sessionHasEnded) { return; }

    this._sessionHasEnded = true;
    LOGi.constellation("Session: Session has ended..", this.handle, this.identifier);

    this._clearBootstrapper();

    for (let unsubscribeListener of this.listeners) { unsubscribeListener(); }

    // wait for the next tick so the cleanup can be done before the next session might be started.
    await xUtil.nextTick();

    this.interactionModule.sessionHasEnded();
    for (let waiter of this._pendingForClose) {
      waiter();
    }
    this._pendingForClose = [];
    core.eventBus.emit(`SessionClosed_${this.handle}`, this.privateId);
  }

  _isSessionActive() {
    return !this._sessionHasEnded && !this._sessionIsKilled;
  }
}

