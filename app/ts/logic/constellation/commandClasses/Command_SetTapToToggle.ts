import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetTapToToggle extends CommandBase implements CommandBaseInterface {

  enabled: boolean;
  constructor(enabled: boolean) {
    super("setTapToToggle");
    this.enabled = enabled;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setTapToToggle(connectedHandle, this.enabled);
  }
  
}

