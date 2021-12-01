import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetDimmerTempUpThreshold extends CommandBase implements CommandBaseInterface {


  value: number;
  constructor(value: number) {
    super("setDimmerTempUpThreshold");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setDimmerTempUpThreshold(connectedHandle, this.value);
  }
  
}

