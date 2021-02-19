import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_RegisterTrackedDevice extends CommandBase implements CommandBaseInterface {

  trackingNumber:number
  locationUID:() => number | number
  profileId:number
  rssiOffset:number
  ignoreForPresence:boolean
  tapToToggleEnabled:boolean
  deviceToken:number
  ttlMinutes:number
  constructor(trackingNumber:number,
              locationUID:() => number | number,
              profileId:number,
              rssiOffset:number,
              ignoreForPresence:boolean,
              tapToToggleEnabled:boolean,
              deviceToken:number,
              ttlMinutes:number) {
    super("registerTrackedDevice");
    this.trackingNumber     = trackingNumber;
    this.locationUID        = locationUID;
    this.profileId          = profileId;
    this.rssiOffset         = rssiOffset;
    this.ignoreForPresence  = ignoreForPresence;
    this.tapToToggleEnabled = tapToToggleEnabled;
    this.deviceToken        = deviceToken;
    this.ttlMinutes         = ttlMinutes;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    let locationUID = typeof this.locationUID == "function" ? this.locationUID() : this.locationUID;
    return BluenetPromiseWrapper.registerTrackedDevice(
      connectedHandle,
      this.trackingNumber,
      locationUID,
      this.profileId,
      this.rssiOffset,
      this.ignoreForPresence,
      this.tapToToggleEnabled,
      this.deviceToken,
      this.ttlMinutes
    );
  }

  duplicateCheck(otherCommand: CommandBaseInterface): boolean {
    return this.trackingNumber === (otherCommand as Command_RegisterTrackedDevice).trackingNumber;
  };

}

