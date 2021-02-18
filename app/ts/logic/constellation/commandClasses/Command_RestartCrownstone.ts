// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_RestartCrownstone extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "restartCrownstone");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.restartCrownstone(this.handle);
  }
  
}

