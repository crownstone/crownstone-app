// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetVoltageZero extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getVoltageZero");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getVoltageZero(this.handle);
  }
  
}

