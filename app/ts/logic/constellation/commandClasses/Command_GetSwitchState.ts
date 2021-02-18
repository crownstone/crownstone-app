// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetSwitchState extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getSwitchState");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.getSwitchState(this.handle);
  }
  
}

