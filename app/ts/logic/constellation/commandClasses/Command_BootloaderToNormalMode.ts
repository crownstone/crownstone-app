// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_BootloaderToNormalMode extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "bootloaderToNormalMode");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.bootloaderToNormalMode(this.handle);
  }
  
}

