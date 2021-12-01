// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetDimmerTempUpThreshold extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getDimmerTempUpThreshold");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getDimmerTempUpThreshold(connectedHandle);
  }
  
}

