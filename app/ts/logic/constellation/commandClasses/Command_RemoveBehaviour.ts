import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_RemoveBehaviour extends CommandBase implements CommandBaseInterface {

  index: number;
  constructor(handle: string, index: number) {
    super(handle, "removeBehaviour");
    this.index = index;
  }


  async execute(options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.removeBehaviour(this.handle, this.index);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return this.index == (otherCommand as Command_RemoveBehaviour).index;
  }
}

