import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SetTime extends CommandBase implements CommandBaseInterface {

  time: number;
  // timestamp in seconds since epoch
  constructor(handle: string, time?: number) {
    super(handle, "setTime");
    this.time = time;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    let timeToSet = this.time === undefined ? xUtil.nowToCrownstoneTime() : this.time;
    return BluenetPromiseWrapper.meshSetTime(this.handle, timeToSet);
  }
}

