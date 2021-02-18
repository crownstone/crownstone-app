import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_AllowDimming extends CommandBase implements CommandBaseInterface {

  allow : boolean
  constructor(handle: string, allow: boolean) {
    super(handle, "allowDimming");
    this.allow = allow;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.allowDimming(this.handle, this.allow);
  }
  
}

