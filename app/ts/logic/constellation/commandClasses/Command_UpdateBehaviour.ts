import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_UpdateBehaviour extends CommandBase implements CommandBaseInterface {

  behaviourTransfer : behaviourTransfer
  constructor(behaviour: behaviourTransfer) {
    super("updateBehaviour");
    this.behaviourTransfer = behaviour;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.updateBehaviour(connectedHandle, this.behaviourTransfer);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfer, (otherCommand as Command_UpdateBehaviour).behaviourTransfer);
  }
}