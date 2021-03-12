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

const CONNECTION_THRESHOLD = Platform.OS === 'ios' ? -90 : -90;

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


  constructor(handle: string, privateId: string | null, interactionModule : SessionInteractionModule) {
    this.handle = handle;
    this.interactionModule = interactionModule;
    this.privateId = privateId || null;
    let reference  = MapProvider.stoneHandleMap[handle];
    this.sphereId  = reference?.sphereId || null;

    this._respondTo(NativeBus.topics.connectedToPeripheral,      () => { this.state = "CONNECTED"; })
    this._respondTo(NativeBus.topics.disconnectedFromPeripheral, () => {
      this.state = "DISCONNECTED";
      // if (this.isPrivate() === false || this.sessionIsKilled) {
      //   this.sessionHasEnded();
      // }
      this.sessionHasEnded();
    });

    this.initializeBootstrapper();

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

    this._clearBootstrapper();

    let activator = (data : crownstoneBaseAdvertisement) => {
      if (data.handle.toLowerCase() === this.handle.toLowerCase()) {
        if (this.sessionIsActivated === false && data.handle.toLowerCase() === this.handle.toLowerCase()) {
          if (data.rssi >= CONNECTION_THRESHOLD) {
            this.tryToActivate();
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


  async tryToActivate() {
    if (this.interactionModule.canActivate()) {
      await this.connect();
    }
  }


  _respondTo(event : string, callback: () => void) {
    this.listeners.push(NativeBus.on(event,(handle) => {
      if (handle.toLowerCase() === this.handle.toLowerCase()) { callback(); }
    }));
  }


  isPrivate()   : boolean { return this.privateId !== null;        }
  isClosing()   : boolean { return this.state === "DISCONNECTING"; }
  isConnected() : boolean { return this.state === "CONNECTED";     }


  async connect() {
    LOGd.constellation("Session: Start connecting to", this.handle);
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

    LOGi.constellation("Session: Connected to", this.handle);
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
    await BleCommandManager.performCommand(this.handle, this.privateId);
    this.state = "CONNECTED";

    if (this.sessionIsKilled) {
      return this.disconnect();
    }

    // We do this on the next tick to allow for chaining new commands after this one has been resolved.
    await xUtil.nextTick()
    await this.handleCommands();
  }


  /**
   * This will be called when the SessionManager closes this session.
   */
  async kill() {
    this.sessionIsKilled = true;
    switch (this.state) {
      case "INITIALIZING":
        return this.sessionHasEnded();
      case "CONNECTING":
        await BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
        return;
      case "CONNECTED":
        await this.disconnect();
        return;
      case "PERFORMING_COMMAND":
        return;
      case "WAITING_FOR_COMMANDS":
        await this.disconnect();
        return;
      case "DISCONNECTING":
        // the session will be cleared by the disconnected event listener
        return;
    }
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
    this.interactionModule.sessionHasEnded();
    for (let unsubscribeListener of this.listeners) { unsubscribeListener(); }
    this._clearBootstrapper();

    core.eventBus.emit(`SessionClosed_${this.handle}`, this.privateId);
  }
}

