import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_AllowDimming extends CommandBase implements CommandBaseInterface {

  allow : boolean
  constructor(allow: boolean) {
    super("allowDimming");
    this.allow = allow;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.allowDimming(connectedHandle, this.allow);
  }
  
}

