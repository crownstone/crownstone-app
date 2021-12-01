import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetPowerZero extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setPowerZero");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setPowerZero(connectedHandle, this.value);
  }
  
}

