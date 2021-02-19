import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_LockSwitch extends CommandBase implements CommandBaseInterface {


  lock : boolean
  constructor(lock: boolean) {
    super("lockSwitch");
    this.lock = lock;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.lockSwitch(connectedHandle, this.lock);
  }
  
}

