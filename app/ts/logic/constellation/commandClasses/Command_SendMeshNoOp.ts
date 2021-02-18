// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SendMeshNoOp extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "sendMeshNoOp");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.sendMeshNoOp(this.handle);
  }
  
}

