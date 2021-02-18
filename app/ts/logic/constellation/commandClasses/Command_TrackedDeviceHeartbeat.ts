import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_TrackedDeviceHeartbeat extends CommandBase implements CommandBaseInterface {

  trackingNumber : number;
  locationUID    : number;
  deviceToken    : number;
  ttlMinutes     : number;
  constructor(handle         : string,
              trackingNumber : number,
              locationUID    : number,
              deviceToken    : number,
              ttlMinutes     : number,
  ) {
    super(handle, "trackedDeviceHeartbeat");
    this.trackingNumber = trackingNumber;
    this.locationUID    = locationUID;
    this.deviceToken    = deviceToken;
    this.ttlMinutes     = ttlMinutes;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.trackedDeviceHeartbeat(
      this.handle,
      this.trackingNumber,
      this.locationUID,
      this.deviceToken,
      this.ttlMinutes
    )
  }
  
}

