// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetAdcChannelSwaps extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getAdcChannelSwaps");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<AdcSwapCount> {
    return BluenetPromiseWrapper.getAdcChannelSwaps(connectedHandle);
  }
  
}

