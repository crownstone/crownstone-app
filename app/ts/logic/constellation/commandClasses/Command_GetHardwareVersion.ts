// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetHardwareVersion extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getHardwareVersion");
  }


  async execute(options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getHardwareVersion(this.handle);
  }
  
}

