// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SendNoOp extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "sendNoOp");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.sendNoOp(this.handle);
  }
  
}

