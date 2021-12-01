import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetCurrentZero extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setCurrentZero");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setCurrentZero(connectedHandle, this.value);
  }
  
}

