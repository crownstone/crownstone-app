// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetGPREGRET extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getGPREGRET");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<GPREGRET[]> {
    return BluenetPromiseWrapper.getGPREGRET(connectedHandle);
  }
  
}

