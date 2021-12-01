// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetCurrentZero extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getCurrentZero");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getCurrentZero(connectedHandle);
  }
  
}

