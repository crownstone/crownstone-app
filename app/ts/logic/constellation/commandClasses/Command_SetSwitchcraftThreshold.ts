import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetSwitchcraftThreshold extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setSwitchcraftThreshold");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSwitchcraftThreshold(connectedHandle, this.value);
  }
  
}

