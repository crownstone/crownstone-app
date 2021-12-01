// GENERATED FILE (REMOVE IF FILE IS CHANGED)

import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_GetMaxChipTemp extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getMaxChipTemp");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getMaxChipTemp(connectedHandle);
  }
  
}

