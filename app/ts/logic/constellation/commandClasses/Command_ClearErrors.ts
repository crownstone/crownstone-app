import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_ClearErrors extends CommandBase implements CommandBaseInterface {

  clearErrorData: clearErrorData;
  constructor(handle: string, clearErrorData: clearErrorData) {
    super(handle, "clearErrors");
    this.clearErrorData = clearErrorData;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.clearErrors(this.handle, this.clearErrorData);
  }


  duplicateCheck(otherCommand: CommandBase): boolean {
    return xUtil.deepCompare(this.clearErrorData, (otherCommand as Command_ClearErrors).clearErrorData);
  }
}

