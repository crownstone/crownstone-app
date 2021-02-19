import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { xUtil } from "../../../util/StandAloneUtil";


export class Command_ClearErrors extends CommandBase implements CommandBaseInterface {

  clearErrorData: clearErrorData;
  constructor(clearErrorData: clearErrorData) {
    super("clearErrors");
    this.clearErrorData = clearErrorData;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.clearErrors(connectedHandle, this.clearErrorData);
  }

}

