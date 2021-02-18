// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_FactoryResetHubOnly extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "factoryResetHubOnly");
  }


  async execute(options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.factoryResetHubOnly(this.handle);
  }
  
}

