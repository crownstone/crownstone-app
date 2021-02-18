import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SetupCrownstone extends CommandBase implements CommandBaseInterface {

  setupData: setupData;
  constructor(handle: string, dataObject: setupData) {
    super(handle, "setupCrownstone");
    this.setupData = dataObject;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setupCrownstone(this.handle, this.setupData);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.setupData, (otherCommand as Command_SetupCrownstone).setupData);
  }
}

