import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_RegisterTrackedDevice extends CommandBase implements CommandBaseInterface {

  trackingNumber:number
  locationUID:number
  profileId:number
  rssiOffset:number
  ignoreForPresence:boolean
  tapToToggleEnabled:boolean
  deviceToken:number
  ttlMinutes:number
  constructor(handle: string,
              trackingNumber:number,
              locationUID:number,
              profileId:number,
              rssiOffset:number,
              ignoreForPresence:boolean,
              tapToToggleEnabled:boolean,
              deviceToken:number,
              ttlMinutes:number) {
    super(handle, "registerTrackedDevice");
    this.trackingNumber     = trackingNumber;
    this.locationUID        = locationUID;
    this.profileId          = profileId;
    this.rssiOffset         = rssiOffset;
    this.ignoreForPresence  = ignoreForPresence;
    this.tapToToggleEnabled = tapToToggleEnabled;
    this.deviceToken        = deviceToken;
    this.ttlMinutes         = ttlMinutes;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.registerTrackedDevice(
      this.handle,
      this.trackingNumber,
      this.locationUID,
      this.profileId,
      this.rssiOffset,
      this.ignoreForPresence,
      this.tapToToggleEnabled,
      this.deviceToken,
      this.ttlMinutes
    );
  }
  
}

