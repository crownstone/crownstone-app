import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetCurrentZero extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(handle: string, value: number) {
    super(handle, "setCurrentZero");
    this.value = value;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setCurrentZero(this.handle, this.value);
  }
  
}

