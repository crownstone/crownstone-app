import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SyncBehaviours extends CommandBase implements CommandBaseInterface {

  behaviourTransfers : behaviourTransfer[]
  constructor(behaviours: behaviourTransfer[]) {
    super("syncBehaviours");
    this.behaviourTransfers = behaviours;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<behaviourTransfer[]> {
    return BluenetPromiseWrapper.syncBehaviours(connectedHandle, this.behaviourTransfers);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfers, (otherCommand as Command_SyncBehaviours).behaviourTransfers);
  }
}

