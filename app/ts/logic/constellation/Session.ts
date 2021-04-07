/**
 * A Session is a connection that is requested by a part of the app. It is pending or connected, and it will request
 * commands from the queue on completion.
 *
 * It will handle keep-open connections via no-ops and it will disconnect when required using a disconnect
 * command and/or direct disconnect.
 */

import { NativeBus } from "../../native/libInterface/NativeBus";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { BleCommandManager } from "./BleCommandManager";
import { core } from "../../core";
import { Platform } from "react-native";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { LOGd, LOGi } from "../../logging/Log";
import { act } from "@testing-library/react-native";
import { Scheduler } from "../Scheduler";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";

const CONNECTION_THRESHOLD_MIN  = Platform.OS === 'ios' ? -73 : -73;
const CONNECTION_THRESHOLD_STEP = Platform.OS === 'ios' ? -3  : -3;
const CONNECTION_THRESHOLD_MAX  = Platform.OS === 'ios' ? -85 : -85;
const HISTORICAL_THRESHOLD      = Platform.OS === 'ios' ? -75 : -75;

export class Session {
  state    : ConnectionState = "INITIALIZING"
  handle   : string
  sphereId : string

  identifier = xUtil.getShortUUID()

  sessionIsActivated = false;
  sessionIsKilled = false;

  privateId : string | null;
  listeners = [];

  _unsubscribeBootstrappers = []

  crownstoneMode : CrownstoneMode;
  interactionModule: SessionInteractionModule;

  _cleanupPrivateBackup = null;

  _weakRSSImeasurements = 0;

  constructor(handle: string, privateId: string | null, interactionModule : SessionInteractionModule) {
    this.handle = handle;
    this.interactionModule = interactionModule;
    this.privateId = privateId || null;
    let reference  = MapProvider.stoneHandleMap[handle];
    this.sphereId  = reference?.sphereId || null;

    LOGd.constellation("Session: Creating session", this.handle, this.identifier);

    this._respondTo(NativeBus.topics.connectedToPeripheral,      () => { this.state = "CONNECTED"; })
    this._respondTo(NativeBus.topics.disconnectedFromPeripheral, () => { this.sessionHasEnded();   });

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
        if (this.state === "WAITING_FOR_COMMANDS") {
          // we do this next tick to ensure all the loading processes are finished.
          // I don't want it to matter too much when the commandloaded is called compared to when the actual command
          // is loaded. This solves that issue.
          await xUtil.nextTick()
          await this.handleCommands();
        }
      }));
      this.tryToActivate();
    }
  }


  reActivate() {
    if (this._cleanupPrivateBackup !== null) {
      this._cleanupPrivateBackup();
      this._cleanupPrivateBackup = null;
      this.interactionModule.isDeactivated();
      this.initializeBootstrapper();
    }
  }


  initializeBootstrapper() {
    this.state = "INITIALIZING";
    this.sessionIsActivated = false;
    this._weakRSSImeasurements = 0;

    this._clearBootstrapper();

    let activator = (data : crownstoneBaseAdvertisement) => {
      if (data.handle === this.handle) {
        if (this.sessionIsActivated === false) {
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
  isConnected() : boolean { return this.state === "CONNECTED";     }


  async connect() {
    LOGd.constellation("Session: Start connecting to", this.handle, this.identifier);
    // remove the listener for ibeacons from this device.
    this._clearBootstrapper()

    this.interactionModule.willActivate();
    this.sessionIsActivated = true;
    this.state = "CONNECTING";
    try {
      this.crownstoneMode = await BluenetPromiseWrapper.connect(this.handle, this.sphereId);
    }
    catch (err) {
      if (err === "CONNECTION_CANCELLED") {
        if (this.sessionIsKilled) {
          this.sessionHasEnded();
          return;
        }
      }

      // a failed connection will automatically retry untill the session is ended.
      this.interactionModule.isDeactivated();
      this.initializeBootstrapper();
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
    let commandsAvailable = BleCommandManager.areThereCommandsFor(this.handle, this.privateId);

    if (commandsAvailable === false) {
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
    LOGd.constellation("Session: performing available command...", this.handle, this.identifier);
    await BleCommandManager.performCommand(this.handle, this.privateId);
    LOGd.constellation("Session: Finished available command...", this.handle, this.identifier);
    this.state = "CONNECTED";

    if (this.sessionIsKilled) {
      return this.disconnect();
    }

    // We do this on the next tick to allow for chaining new commands after this one has been resolved.
    await xUtil.nextTick();
    await this.handleCommands();
  }


  /**
   * This will be called when the SessionManager closes this session.
   */
  async kill() {
    LOGd.constellation("Session: killing session",this.state, this.handle, this.identifier)
    this.sessionIsKilled = true;
    switch (this.state) {
      case "INITIALIZING":
        this.sessionHasEnded();
        break;
      case "CONNECTING":
        await BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
        break;
      case "CONNECTED":
        await this.disconnect();
        break;
      case "PERFORMING_COMMAND":
        break;
      case "WAITING_FOR_COMMANDS":
        await this.disconnect();
        break;
      case "DISCONNECTING":
        // the session will be cleared by the disconnected event listener
        break;
    }
    LOGd.constellation("Session: killing session completed", this.handle, this.identifier);
  }


  async disconnect() {
    this.state = "DISCONNECTING";
    try {
      await BleCommandManager.performClosingCommands(this.handle, this.privateId, this.crownstoneMode)
    }
    catch (e) {}
    await BluenetPromiseWrapper.phoneDisconnect(this.handle);
  }


  deactivate() {
    if (this.isPrivate() || this.isClosing()) { return; }
    if (this.sessionIsActivated === false)    { return; }
    if (this.state === "CONNECTED")           { return; }
    if (this.state === "CONNECTING") {
      BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
      this.interactionModule.isDeactivated();
    }

    this.initializeBootstrapper();
  }


  sessionHasEnded() {
    LOGd.constellation("Session: Session has ended..", this.handle, this.identifier);

    this.state = "DISCONNECTED";

    this.interactionModule.sessionHasEnded();
    for (let unsubscribeListener of this.listeners) { unsubscribeListener(); }
    this._clearBootstrapper();

    core.eventBus.emit(`SessionClosed_${this.handle}`, this.privateId);
  }
}

