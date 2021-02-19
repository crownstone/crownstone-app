// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_CancelConnectionRequest extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("cancelConnectionRequest");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.cancelConnectionRequest(connectedHandle);
  }
  
}

