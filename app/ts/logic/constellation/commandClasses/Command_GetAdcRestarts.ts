// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetAdcRestarts extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getAdcRestarts");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<AdcRestart> {
    return BluenetPromiseWrapper.getAdcRestarts(connectedHandle);
  }
  
}

