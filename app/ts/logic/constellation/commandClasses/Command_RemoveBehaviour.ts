import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_RemoveBehaviour extends CommandBase implements CommandBaseInterface {

  index: number;
  constructor(index: number) {
    super("removeBehaviour");
    this.index = index;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.removeBehaviour(connectedHandle, this.index);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return this.index == (otherCommand as Command_RemoveBehaviour).index;
  }
}

