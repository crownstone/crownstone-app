// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetLastResetReason extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getLastResetReason");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<ResetReason> {
    return BluenetPromiseWrapper.getLastResetReason(connectedHandle);
  }
  
}

