// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_CommandFactoryReset extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "commandFactoryReset");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.commandFactoryReset(this.handle);
  }
  
}

