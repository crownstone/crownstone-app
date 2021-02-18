import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_UpdateBehaviour extends CommandBase implements CommandBaseInterface {

  behaviourTransfer : behaviourTransfer
  constructor(handle: string, behaviour: behaviourTransfer) {
    super(handle, "updateBehaviour");
    this.behaviourTransfer = behaviour;
  }


  async execute(options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.updateBehaviour(this.handle, this.behaviourTransfer);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfer, (otherCommand as Command_UpdateBehaviour).behaviourTransfer);
  }
}