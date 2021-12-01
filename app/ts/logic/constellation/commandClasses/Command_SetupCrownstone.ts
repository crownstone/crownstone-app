import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_SetupCrownstone extends CommandBase implements CommandBaseInterface {

  setupData: setupData;
  constructor(dataObject: setupData) {
    super("setupCrownstone");
    this.setupData = dataObject;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setupCrownstone(connectedHandle, this.setupData);
  }


  duplicateCheck(otherCommand: CommandBase) {
    return xUtil.deepCompare(this.setupData, (otherCommand as Command_SetupCrownstone).setupData);
  }
}

