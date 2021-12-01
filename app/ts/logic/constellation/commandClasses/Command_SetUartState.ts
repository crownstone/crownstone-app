import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetUartState extends CommandBase implements CommandBaseInterface {

  value: 0 | 1 | 3;
  constructor(value: 0 | 1 | 3) {
    super("setUartState");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.setUartState(connectedHandle, this.value);
  }
  
}

