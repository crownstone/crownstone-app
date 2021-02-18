// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetupFactoryReset extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "setupFactoryReset");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setupFactoryReset(this.handle);
  }
  
}

