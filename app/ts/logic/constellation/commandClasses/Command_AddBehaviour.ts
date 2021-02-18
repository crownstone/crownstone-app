import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_AddBehaviour extends CommandBase implements CommandBaseInterface {

  behaviourTransfer : behaviourTransfer
  constructor(handle: string, behaviour: behaviourTransfer) {
    super(handle, "addBehaviour");
    this.behaviourTransfer = behaviour;
  }


  async execute(options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.addBehaviour(this.handle, this.behaviourTransfer);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfer, (otherCommand as Command_AddBehaviour).behaviourTransfer);
  }
  
}

