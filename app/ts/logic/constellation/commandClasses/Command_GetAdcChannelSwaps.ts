// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetAdcChannelSwaps extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getAdcChannelSwaps");
  }


  async execute(options: ExecutionOptions) : Promise<AdcSwapCount> {
    return BluenetPromiseWrapper.getAdcChannelSwaps(this.handle);
  }
  
}

