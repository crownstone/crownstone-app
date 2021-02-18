import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetTapToToggle extends CommandBase implements CommandBaseInterface {

  enabled: boolean;
  constructor(handle: string, enabled: boolean) {
    super(handle, "setTapToToggle");
    this.enabled = enabled;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setTapToToggle(this.handle, this.enabled);
  }
  
}

