import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_Connect extends CommandBase implements CommandBaseInterface {

  referenceId: string;
  constructor(handle: string, referenceId: string) {
    super(handle, "connect");
    this.referenceId = referenceId;
  }


  async execute(options: ExecutionOptions) : Promise<CrownstoneMode> {
    return BluenetPromiseWrapper.connect(this.handle, this.referenceId, true);
  }
  
}

