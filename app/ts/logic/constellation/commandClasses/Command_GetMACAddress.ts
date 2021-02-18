import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetMACAddress extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getMACAddress");
  }


  async execute(options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getMACAddress(this.handle);
  }
  
}

