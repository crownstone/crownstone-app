import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SwitchDimmer extends CommandBase implements CommandBaseInterface {

  state: number;
  constructor(handle: string, state: number) {
    super(handle, "switchDimmer");
    this.state = state;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.switchDimmer(this.handle, this.state);
  }
  
}

