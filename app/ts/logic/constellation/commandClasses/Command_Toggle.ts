
import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_Toggle extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "toggle");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.toggleSwitchState(this.handle, 100);
  }
  
}

