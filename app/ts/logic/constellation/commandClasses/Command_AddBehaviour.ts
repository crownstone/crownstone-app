import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_AddBehaviour extends CommandBase implements CommandBaseInterface {

  behaviourTransfer : behaviourTransfer
  constructor(behaviour: behaviourTransfer) {
    super("addBehaviour");
    this.behaviourTransfer = behaviour;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourReply> {
    return BluenetPromiseWrapper.addBehaviour(connectedHandle, this.behaviourTransfer);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfer, (otherCommand as Command_AddBehaviour).behaviourTransfer);
  }
  
}

