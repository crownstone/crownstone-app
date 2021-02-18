// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_DisconnectCommand extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "disconnectCommand");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.disconnectCommand(this.handle);
  }
  
}

