
import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetSwitchState extends CommandBase implements CommandBaseInterface {

  switchState;
  constructor(switchState : number) {
    super("setSwitchState");
    this.switchState = switchState;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSwitchState(connectedHandle, this.switchState);
  }
  
}

