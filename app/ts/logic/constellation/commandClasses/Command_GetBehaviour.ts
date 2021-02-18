import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetBehaviour extends CommandBase implements CommandBaseInterface {

  index : number
  constructor(handle: string, index: number) {
    super(handle, "getBehaviour");
    this.index = index;
  }


  async execute(options: ExecutionOptions) : Promise<behaviourTransfer> {
    return BluenetPromiseWrapper.getBehaviour(this.handle, this.index);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return this.index == (otherCommand as Command_GetBehaviour).index;
  }
  
}

