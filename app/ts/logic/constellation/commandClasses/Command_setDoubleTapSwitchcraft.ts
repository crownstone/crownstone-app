import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_setDoubleTapSwitchcraft extends CommandBase implements CommandBaseInterface {

  enable : boolean
  constructor(enable: boolean) {
    super("setDoubleTapSwitchcraft");
    this.enable = enable;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setDoubleTapSwitchcraft(connectedHandle, this.enable);
  }
  
}

