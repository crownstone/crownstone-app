// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetAdcRestarts extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getAdcRestarts");
  }


  async execute(options: ExecutionOptions) : Promise<AdcRestart> {
    return BluenetPromiseWrapper.getAdcRestarts(this.handle);
  }
  
}

