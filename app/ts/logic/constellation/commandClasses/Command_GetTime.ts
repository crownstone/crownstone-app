import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetTime extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getTime");
  }


  // this gets the Crownstone time in seconds.
  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.getTime(connectedHandle);
  }
  
}

