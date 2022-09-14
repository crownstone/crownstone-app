import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Command_RegisterTrackedDevice } from "./Command_RegisterTrackedDevice";
import { LOGe, LOGi } from "../../../logging/Log";



export class Command_TrackedDeviceHeartbeat extends CommandBase implements CommandBaseInterface {

  trackingNumber  : number;
  locationUID     : () => number | number;
  deviceToken     : number;
  ttlMinutes      : number;
  registerPayload : RegisterPayload;
  constructor(trackingNumber : number,
              locationUID    : () => number | number,
              deviceToken    : number,
              ttlMinutes     : number,
              registerPayload: RegisterPayload
  ) {
    super("trackedDeviceHeartbeat");
    this.trackingNumber = trackingNumber;
    this.locationUID    = locationUID;
    this.deviceToken    = deviceToken;
    this.ttlMinutes     = ttlMinutes;
    this.registerPayload = registerPayload;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    let locationUID = typeof this.locationUID == "function" ? this.locationUID() : this.locationUID;
    try {
      await BluenetPromiseWrapper.trackedDeviceHeartbeat(
        connectedHandle,
        this.trackingNumber,
        locationUID,
        this.deviceToken,
        this.ttlMinutes
      );
    }
    catch (err : any) {
      LOGe.constellation("Command: TrackedDeviceHeartBeat has generated error: ", err?.message, connectedHandle)
      switch (err?.message) {
        case "ERR_NOT_FOUND":
        case "ERR_TIMEOUT":
          LOGi.constellation("Command: TrackedDeviceHeartBeat will try to register to recover ", err?.message, connectedHandle)
          await this.register(connectedHandle, options)
          break
        default:
          throw err
      }
    }
  }

  async register(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    let command = new Command_RegisterTrackedDevice(
      this.trackingNumber,
      this.locationUID,
      this.registerPayload.profileId,
      this.registerPayload.rssiOffset,
      this.registerPayload.ignoreForPresence,
      this.registerPayload.tapToToggleEnabled,
      this.deviceToken,
      this.registerPayload.ttlMinutes
    );

    await command.execute(connectedHandle,options)
  }
}

