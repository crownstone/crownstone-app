import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SwitchDimmer extends CommandBase implements CommandBaseInterface {

  state: number;
  constructor(state: number) {
    super("switchDimmer");
    this.state = state;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.switchDimmer(connectedHandle, this.state);
  }
  
}

