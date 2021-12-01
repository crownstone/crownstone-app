import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SetTime extends CommandBase implements CommandBaseInterface {

  time: number;
  // timestamp in seconds since epoch
  constructor(time?: number) {
    super("setTime");
    this.time = time;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    let timeToSet = this.time === undefined ? xUtil.nowToCrownstoneTime() : this.time;
    return BluenetPromiseWrapper.meshSetTime(connectedHandle, timeToSet);
  }
}

