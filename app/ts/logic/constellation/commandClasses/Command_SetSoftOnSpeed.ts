import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";


export class Command_SetSoftOnSpeed extends CommandBase implements CommandBaseInterface {

  speed: number;
  constructor(speed: number) {
    super("setSoftOnSpeed");
    this.speed = speed;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSoftOnSpeed(connectedHandle, this.speed);
  }
  
}

