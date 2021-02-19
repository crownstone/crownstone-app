import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetCurrentMultiplier extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setCurrentMultiplier");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setCurrentMultiplier(connectedHandle, this.value);
  }
  
}

