// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetupPutInDFU extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "setupPutInDFU");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setupPutInDFU(this.handle);
  }
  
}
