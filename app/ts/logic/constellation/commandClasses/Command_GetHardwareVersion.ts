// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetHardwareVersion extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getHardwareVersion");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getHardwareVersion(connectedHandle);
  }
  
}

