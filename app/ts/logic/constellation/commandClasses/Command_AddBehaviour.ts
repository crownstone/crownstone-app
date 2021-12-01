import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { xUtil } from "../../../util/StandAloneUtil";
import { LOGw } from "../../../logging/Log";


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
    let isDuplicate = xUtil.deepCompare(this.behaviourTransfer, (otherCommand as Command_AddBehaviour).behaviourTransfer);
    if (isDuplicate) {
      LOGw.info("Duplicate behaviour detected", JSON.stringify(this.behaviourTransfer), JSON.stringify((otherCommand as Command_AddBehaviour).behaviourTransfer));
    }
    return isDuplicate
  }
  
}

