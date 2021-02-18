import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetUartState extends CommandBase implements CommandBaseInterface {

  value: 0 | 1 | 3;
  constructor(handle: string, value: 0 | 1 | 3) {
    super(handle, "setUartState");
    this.value = value;
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.setUartState(this.handle, this.value);
  }
  
}

