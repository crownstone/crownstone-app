import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_LockSwitch extends CommandBase implements CommandBaseInterface {


  lock : boolean
  constructor(handle: string, lock: boolean) {
    super(handle, "lockSwitch");
    this.lock = lock;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.lockSwitch(this.handle, this.lock);
  }
  
}

