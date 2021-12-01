// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetSoftOnSpeed extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getSoftOnSpeed");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getSoftOnSpeed(connectedHandle);
  }
  
}

