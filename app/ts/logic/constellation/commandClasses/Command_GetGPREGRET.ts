// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetGPREGRET extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getGPREGRET");
  }


  async execute(options: ExecutionOptions) : Promise<GPREGRET[]> {
    return BluenetPromiseWrapper.getGPREGRET(this.handle);
  }
  
}

