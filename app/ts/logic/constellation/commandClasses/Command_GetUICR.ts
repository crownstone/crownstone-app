// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetUICR extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getHardwareVersion");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<UICRData> {
    return BluenetPromiseWrapper.getUICR(connectedHandle);
  }
  
}

