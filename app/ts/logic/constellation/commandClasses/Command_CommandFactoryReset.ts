// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_CommandFactoryReset extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("commandFactoryReset");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.commandFactoryReset(connectedHandle);
  }
  
}

