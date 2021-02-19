import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetBehaviour extends CommandBase implements CommandBaseInterface {

  index : number
  constructor(index: number) {
    super("getBehaviour");
    this.index = index;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourTransfer> {
    return BluenetPromiseWrapper.getBehaviour(connectedHandle, this.index);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return this.index == (otherCommand as Command_GetBehaviour).index;
  }
  
}

