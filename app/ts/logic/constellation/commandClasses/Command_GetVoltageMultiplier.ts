// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetVoltageMultiplier extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getVoltageMultiplier");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getVoltageMultiplier(this.handle);
  }
  
}

