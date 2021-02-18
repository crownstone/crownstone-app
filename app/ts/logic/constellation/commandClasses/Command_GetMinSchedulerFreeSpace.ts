// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetMinSchedulerFreeSpace extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getMinSchedulerFreeSpace");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getMinSchedulerFreeSpace(this.handle);
  }
  
}

