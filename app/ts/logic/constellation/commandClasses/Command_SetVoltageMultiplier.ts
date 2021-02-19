import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetVoltageMultiplier extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setVoltageMultiplier");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setVoltageMultiplier(connectedHandle, this.value);
  }
  
}

