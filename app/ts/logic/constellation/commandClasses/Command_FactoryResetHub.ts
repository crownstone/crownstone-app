// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_FactoryResetHub extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("factoryResetHub");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.factoryResetHub(connectedHandle);
  }
  
}

