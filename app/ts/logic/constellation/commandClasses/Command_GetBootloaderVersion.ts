// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetBootloaderVersion extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getBootloaderVersion");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getBootloaderVersion(connectedHandle);
  }
  
}

