import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetDimmerCurrentThreshold extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setDimmerCurrentThreshold");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setDimmerCurrentThreshold(connectedHandle, this.value);
  }
  
}

