import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetSwitchCraft extends CommandBase implements CommandBaseInterface {

  state: boolean
  constructor(state: boolean) {
    super("setSwitchCraft");
    this.state = state;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSwitchCraft(connectedHandle, this.state);
  }
  
}

