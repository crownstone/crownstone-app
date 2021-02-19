// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetSwitchHistory extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getSwitchHistory");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<SwitchHistory[]> {
    return BluenetPromiseWrapper.getSwitchHistory(connectedHandle);
  }
  
}

