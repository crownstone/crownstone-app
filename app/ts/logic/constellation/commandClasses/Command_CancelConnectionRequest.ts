// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_CancelConnectionRequest extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "cancelConnectionRequest");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.cancelConnectionRequest(this.handle);
  }
  
}

