import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetMaxChipTemp extends CommandBase implements CommandBaseInterface {

  value: number;
  constructor(value: number) {
    super("setMaxChipTemp");
    this.value = value;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setMaxChipTemp(connectedHandle, this.value);
  }
  
}

