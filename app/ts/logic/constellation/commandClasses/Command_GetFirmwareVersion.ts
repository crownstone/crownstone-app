// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetFirmwareVersion extends CommandBase implements CommandBaseInterface {

  constructor(handle: string) {
    super(handle, "getFirmwareVersion");
  }


  async execute(options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getFirmwareVersion(this.handle);
  }
  
}

