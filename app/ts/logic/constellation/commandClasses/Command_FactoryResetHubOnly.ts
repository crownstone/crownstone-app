// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_FactoryResetHubOnly extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("factoryResetHubOnly");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.factoryResetHubOnly(connectedHandle);
  }
  
}

