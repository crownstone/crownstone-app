import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetTapToToggleThresholdOffset extends CommandBase implements CommandBaseInterface {


  rssiThresholdOffset : number;
  constructor(handle: string, rssiThresholdOffset : number) {
    super(handle, "setTapToToggleThresholdOffset");
    this.rssiThresholdOffset = rssiThresholdOffset;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setTapToToggleThresholdOffset(this.handle, this.rssiThresholdOffset);
  }
  
}

