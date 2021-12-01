import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_Toggle extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("toggle");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<number> {
    return BluenetPromiseWrapper.toggleSwitchState(connectedHandle, 100);
  }
  
}

