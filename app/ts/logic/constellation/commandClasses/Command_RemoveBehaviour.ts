import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { LOGw } from "../../../logging/Log";


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
    let isDuplicate = this.index == (otherCommand as Command_RemoveBehaviour).index;
    if (isDuplicate) {
      LOGw.info("Duplicate behaviour removal trigger detected", this.index, (otherCommand as Command_RemoveBehaviour).index);
    }
    return isDuplicate
  }

  info() {
    return "Removing " + this.index;
  }
}

