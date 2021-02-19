import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetMACAddress extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("getMACAddress");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<string> {
    return BluenetPromiseWrapper.getMACAddress(connectedHandle);
  }
  
}

