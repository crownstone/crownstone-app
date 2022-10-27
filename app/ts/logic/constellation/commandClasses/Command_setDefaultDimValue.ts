import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_setDefaultDimValue extends CommandBase implements CommandBaseInterface {

  value : number
  constructor(value: number) {
    super("setDefaultDimValue");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setDefaultDimValue(connectedHandle, this.value);
  }
  
}

