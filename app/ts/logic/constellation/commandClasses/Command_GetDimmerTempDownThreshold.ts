// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetDimmerTempDownThreshold extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getDimmerTempDownThreshold");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getDimmerTempDownThreshold(connectedHandle);
  }
  
}

