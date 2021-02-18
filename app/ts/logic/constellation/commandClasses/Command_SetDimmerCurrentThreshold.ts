import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetDimmerCurrentThreshold extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(handle: string, value: number) {
    super(handle, "setDimmerCurrentThreshold");
    this.value = value;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setDimmerCurrentThreshold(this.handle, this.value);
  }
  
}

