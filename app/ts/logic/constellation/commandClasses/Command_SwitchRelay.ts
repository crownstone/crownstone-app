import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SwitchRelay extends CommandBase implements CommandBaseInterface {

  state: number;
  constructor(handle: string, state: number) {
    super(handle, "switchRelay");
    this.state = state;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.switchRelay(this.handle, this.state);
  }
  
}

