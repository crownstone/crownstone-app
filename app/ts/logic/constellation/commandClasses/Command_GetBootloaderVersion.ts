// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetBootloaderVersion extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getBootloaderVersion");
  }


  async execute(options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getBootloaderVersion(this.handle);
  }
  
}

