import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetUartKey extends CommandBase implements CommandBaseInterface {

  uartKey: string;
  constructor(handle: string, uartKey: string) {
    super(handle, "setUartKey");
    this.uartKey = uartKey;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setUartKey(this.handle, this.uartKey);
  }
  
}

