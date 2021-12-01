import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_Connect extends CommandBase implements CommandBaseInterface {

  referenceId: string;
  constructor(referenceId: string) {
    super("connect");
    this.referenceId = referenceId;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<CrownstoneMode> {
    return BluenetPromiseWrapper.connect(connectedHandle, this.referenceId);
  }
  
}

