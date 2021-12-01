import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetUartKey extends CommandBase implements CommandBaseInterface {

  uartKey: string;
  constructor(uartKey: string) {
    super("setUartKey");
    this.uartKey = uartKey;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setUartKey(connectedHandle, this.uartKey);
  }
  
}

