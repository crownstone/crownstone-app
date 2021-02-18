import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_SetSunTimesViaConnection extends CommandBase implements CommandBaseInterface {

  sunriseSecondsSinceMidnight : number;
  sunsetSecondsSinceMidnight  : number;
  constructor(handle: string, sunriseSecondsSinceMidnight : number, sunsetSecondsSinceMidnight : number) {
    super(handle, "setSunTimesViaConnection");
    this.sunriseSecondsSinceMidnight = sunriseSecondsSinceMidnight;
    this.sunsetSecondsSinceMidnight  = sunsetSecondsSinceMidnight;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    return BluenetPromiseWrapper.setSunTimesViaConnection(this.handle, this.sunriseSecondsSinceMidnight, this.sunsetSecondsSinceMidnight);
  }
  
}

