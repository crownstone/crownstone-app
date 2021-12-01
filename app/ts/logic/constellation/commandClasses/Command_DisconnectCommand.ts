// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_DisconnectCommand extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("disconnectCommand");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.disconnectCommand(connectedHandle);
  }
  
}

