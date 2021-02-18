import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetSwitchCraft extends CommandBase implements CommandBaseInterface {

  state: boolean
  constructor(handle: string, state: boolean) {
    super(handle, "setSwitchCraft");
    this.state = state;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSwitchCraft(this.handle, this.state);
  }
  
}

