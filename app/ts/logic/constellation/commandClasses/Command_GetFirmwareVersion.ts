// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetFirmwareVersion extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getFirmwareVersion");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getFirmwareVersion(connectedHandle);
  }
  
}

