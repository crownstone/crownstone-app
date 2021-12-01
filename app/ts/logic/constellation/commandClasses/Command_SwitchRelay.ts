import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SwitchRelay extends CommandBase implements CommandBaseInterface {

  state: number;
  constructor(state: number) {
    super("switchRelay");
    this.state = state;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.switchRelay(connectedHandle, this.state);
  }
  
}

