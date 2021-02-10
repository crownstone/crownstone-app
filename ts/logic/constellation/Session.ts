/**
 * A Session is a connection that is requested by a part of the app. It is pending or connected, and it will request
 * commands from the queue on completion.
 *
 * It will handle keep-open connections via no-ops and it will disconnect when required using a disconnect
 * command and/or direct disconnect.
 */
// import { MapProvider } from "../../backgroundProcesses/MapProvider";

import { NativeBus } from "../../native/libInterface/NativeBus";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { BleCommandQueue } from "./BleCommandQueue";
import { core } from "../../core";
import { Platform } from "react-native";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

const CONNECTION_THRESHOLD = Platform.OS === 'ios' ? -90 : -90;

export class Session {
  state    : ConnectionState = "INITIALIZING"
  handle   : string
  sphereId : string

  sessionIsActivated = false;
  sessionIsKilled = false;

  privateId : string | null;
  listeners = [];

  unsubscribeBootstrapper = null

  crownstoneMode : CrownstoneMode;
  interactionModule: SessionInteractionModule



  constructor(handle: string, privateId: string | null, interactionModule : SessionInteractionModule) {
    this.handle = handle;
    this.interactionModule = interactionModule;
    this.privateId = privateId || null;
    let reference = MapProvider.stoneHandleMap[handle];
    this.sphereId = reference?.sphereId || null;

    this._respondTo(NativeBus.topics.connectedToPeripheral,      () => { this.state = "CONNECTED"; })
    this._respondTo(NativeBus.topics.connectedToPeripheralFailed,() => { this.state = "CONNECTION_FAILED";
      if (this.isPrivate() === false || this.sessionIsKilled) { this.delete(); }
    });
    this._respondTo(NativeBus.topics.disconnectedFromPeripheral, () => { this.state = "DISCONNECTED";
      if (this.isPrivate() === false || this.sessionIsKilled) { this.delete(); }
    });

    this.registerBootstrapper();

    if (this.privateId) {
      this.tryToActivate();
    }
  }

  registerBootstrapper() {
    if (this.unsubscribeBootstrapper) {
      this.unsubscribeBootstrapper();
      this.unsubscribeBootstrapper = null;
    }
    this.unsubscribeBootstrapper = core.eventBus.on("iBeaconOfValidCrownstone", (data) => {
      if (this.sessionIsActivated === false && data.handle.toLowerCase() === this.handle.toLowerCase()) {
        if (data.rssi >= CONNECTION_THRESHOLD) {
          this.tryToActivate();
        }
      }
    });
  }

  tryToActivate() {
    if (this.interactionModule.canActivate()) {
      this.connect();
    }
  }

  _respondTo(event : string, callback: () => void) {
    this.listeners.push(NativeBus.on(event,(handle) => {
      if (handle.toLowerCase() === this.handle.toLowerCase()) { callback(); }
    }));
  }

  isPrivate() : boolean { return this.privateId !== null;        }
  isClosing() : boolean { return this.state === "DISCONNECTING"; }


  async connect() {
    // remove the listener for ibeacons from this device.
    this.unsubscribeBootstrapper();
    this.unsubscribeBootstrapper = null;

    this.interactionModule.willActivate();
    this.sessionIsActivated = true;
    this.state = "CONNECTING";
    try {
      this.crownstoneMode = await BluenetPromiseWrapper.connect(this.handle, this.sphereId);
    }
    catch (err) {
      if (err === "CONNECTION_CANCELLED") {
        this.state = "INITIALIZING";
        this.registerBootstrapper();
        return;
      }

      this.state = "CONNECTION_FAILED";
      this.interactionModule.connectionFailed(err);
      if (this.isPrivate() === false || this.sessionIsKilled) {
        this.delete();
      }
      return
    }
    this.state = "CONNECTED";
    this.interactionModule.isConnected();

    // on the next tick we check for commands.
    // This is done to allow for chaining commands in after the connect has succeeded.
    setImmediate(() => { this.handleCommands(); })
  }

  async handleCommands() {
    let commandsAvailable = BleCommandQueue.areThereCommandsFor(this.handle, this.privateId);

    if (commandsAvailable === false) {
      // there is no task for us to do. If we're a private connection, we'll wait patiently for a new command
      if (this.isPrivate()) {
        // Tasks here CAN include connections.
        // TODO: wait for tasks.

        return;
      }
      else {
        // this means that we're done.
        await this.disconnect();
        return this.delete();
      }
    }

    await BleCommandQueue.performCommand(this.handle, this.privateId);


    // We do this on the next tick to allow for chaining new commands after this one has been resolved.
    setImmediate(() => { this.handleCommands(); })
  }

  async kill() {
    this.sessionIsKilled = true;
    switch (this.state) {
      case "INITIALIZING":
        this.interactionModule.connectionFailed("SESSION_KILLED");
        return this.delete();
      case "CONNECTING":
        this.interactionModule.connectionFailed("SESSION_KILLED");
        return await BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
      case "CONNECTION_FAILED":
        return this.delete();
      case "CONNECTED":
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
      await BleCommandQueue.performClosingCommands(this.handle, this.privateId, this.crownstoneMode)
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
    }

    this.sessionIsActivated = false;

  }


  delete() {
    this.interactionModule.cleanup();
    for (let unsubscribeListener of this.listeners) { unsubscribeListener(); }
  }
}

