import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetPowerZero extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(handle: string, value: number) {
    super(handle, "setPowerZero");
    this.value = value;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setPowerZero(this.handle, this.value);
  }
  
}

