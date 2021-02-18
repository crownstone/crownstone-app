// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetLastResetReason extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getLastResetReason");
  }


  async execute(options: ExecutionOptions) : Promise<ResetReason> {
    return BluenetPromiseWrapper.getLastResetReason(this.handle);
  }
  
}

