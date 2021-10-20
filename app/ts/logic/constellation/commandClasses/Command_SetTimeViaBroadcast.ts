import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SetTimeViaBroadcast extends CommandBase implements CommandBaseInterface {

  time: number;
  sunriseTime: number;
  sunsetTime: number;
  timeBasedSessionNonce: boolean;
  // timestamp in seconds since epoch
  constructor(time: number, sunriseTime: number, sunsetTime: number, timeBasedSessionNonce: boolean) {
    super("setTimeViaBroadcast");
    this.time = time;
    this.sunriseTime = sunriseTime;
    this.sunsetTime = sunsetTime;
    this.timeBasedSessionNonce = timeBasedSessionNonce;
    this.canBroadcast = true;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return Promise.resolve()
  }

  async broadcast(bleCommand: BleCommand) {
    return BluenetPromiseWrapper.setTimeViaBroadcast(
      this.time,
      this.sunriseTime,
      this.sunsetTime,
      bleCommand.sphereId,
      this.timeBasedSessionNonce
    )
  }
}

