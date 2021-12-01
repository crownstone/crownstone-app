// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetSwitchcraftThreshold extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getSwitchcraftThreshold");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getSwitchcraftThreshold(connectedHandle);
  }
  
}

