import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetTapToToggleThresholdOffset extends CommandBase implements CommandBaseInterface {


  rssiThresholdOffset : number;
  constructor(rssiThresholdOffset : number) {
    super("setTapToToggleThresholdOffset");
    this.rssiThresholdOffset = rssiThresholdOffset;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setTapToToggleThresholdOffset(connectedHandle, this.rssiThresholdOffset);
  }
  
}

