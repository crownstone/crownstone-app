import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SyncBehaviours extends CommandBase implements CommandBaseInterface {

  behaviourTransfers : behaviourTransfer[]
  constructor(handle: string, behaviours: behaviourTransfer[]) {
    super(handle, "syncBehaviours");
  }


  async execute(options: ExecutionOptions) : Promise<behaviourTransfer[]> {
    return BluenetPromiseWrapper.syncBehaviours(this.handle, this.behaviourTransfers);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.behaviourTransfers, (otherCommand as Command_SyncBehaviours).behaviourTransfers);
  }
}

