// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetDimmerTempUpThreshold extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getDimmerTempUpThreshold");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getDimmerTempUpThreshold(this.handle);
  }
  
}

