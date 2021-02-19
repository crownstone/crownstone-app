import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_TrackedDeviceHeartbeat extends CommandBase implements CommandBaseInterface {

  trackingNumber : number;
  locationUID    : () => number | number;
  deviceToken    : number;
  ttlMinutes     : number;
  constructor(trackingNumber : number,
              locationUID    : () => number | number,
              deviceToken    : number,
              ttlMinutes     : number,
  ) {
    super("trackedDeviceHeartbeat");
    this.trackingNumber = trackingNumber;
    this.locationUID    = locationUID;
    this.deviceToken    = deviceToken;
    this.ttlMinutes     = ttlMinutes;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    let locationUID = typeof this.locationUID == "function" ? this.locationUID() : this.locationUID;
    return BluenetPromiseWrapper.trackedDeviceHeartbeat(
      connectedHandle,
      this.trackingNumber,
      locationUID,
      this.deviceToken,
      this.ttlMinutes
    )
  }
  
}

