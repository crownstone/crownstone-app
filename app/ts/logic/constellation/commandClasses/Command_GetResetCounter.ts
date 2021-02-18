// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetResetCounter extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getResetCounter");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getResetCounter(this.handle);
  }
  
}

