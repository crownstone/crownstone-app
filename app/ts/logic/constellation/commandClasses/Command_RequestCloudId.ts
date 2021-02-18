// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_RequestCloudId extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "requestCloudId");
  }


  async execute(options: ExecutionOptions) : Promise<HubDataReply> {
    return BluenetPromiseWrapper.requestCloudId(this.handle);
  }
  
}

