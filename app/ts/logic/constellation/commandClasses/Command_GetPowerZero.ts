// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetPowerZero extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getPowerZero");
  }


  async execute(options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getPowerZero(this.handle);
  }
  
}

