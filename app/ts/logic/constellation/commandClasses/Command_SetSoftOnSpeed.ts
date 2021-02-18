import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetSoftOnSpeed extends CommandBase implements CommandBaseInterface {

  speed: number;
  constructor(handle: string, speed: number) {
    super(handle, "setSoftOnSpeed");
    this.speed = speed;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSoftOnSpeed(this.handle, this.speed);
  }
  
}

