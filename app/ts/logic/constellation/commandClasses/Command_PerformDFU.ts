import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_PerformDFU extends CommandBase implements CommandBaseInterface {


  uri: string;
  constructor(handle: string, uri: string) {
    super(handle, "performDFU");
    this.uri = uri;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.performDFU(this.handle, this.uri);
  }
  
}

