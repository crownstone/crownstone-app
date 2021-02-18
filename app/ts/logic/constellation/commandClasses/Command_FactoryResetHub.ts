// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_FactoryResetHub extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "factoryResetHub");
  }


  async execute(options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.factoryResetHub(this.handle);
  }
  
}

