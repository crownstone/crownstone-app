// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetSwitchHistory extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getSwitchHistory");
  }


  async execute(options: ExecutionOptions) : Promise<SwitchHistory[]> {
    return BluenetPromiseWrapper.getSwitchHistory(this.handle);
  }
  
}

