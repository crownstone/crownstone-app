import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_PerformDFU extends CommandBase implements CommandBaseInterface {


  uri: string;
  constructor(uri: string) {
    super("performDFU");
    this.uri = uri;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.performDFU(connectedHandle, this.uri);
  }
  
}

