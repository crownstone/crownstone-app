// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_BootloaderToNormalMode extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("bootloaderToNormalMode");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.bootloaderToNormalMode(connectedHandle);
  }
  
}

