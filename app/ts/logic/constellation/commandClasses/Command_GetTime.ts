import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetTime extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getTime");
  }


  // this gets the Crownstone time in seconds.
  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getTime(this.handle);
  }
  
}

