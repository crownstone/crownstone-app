// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetBehaviourDebugInformation extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getBehaviourDebugInformation");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourDebug> {
    return BluenetPromiseWrapper.getBehaviourDebugInformation(connectedHandle);
  }
  
}

