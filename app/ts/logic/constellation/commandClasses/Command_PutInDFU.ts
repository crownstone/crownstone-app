// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_PutInDFU extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "putInDFU");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.putInDFU(this.handle);
  }
  
}

