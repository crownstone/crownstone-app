// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_RestartCrownstone extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("restartCrownstone");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.restartCrownstone(connectedHandle);
  }
  
}

