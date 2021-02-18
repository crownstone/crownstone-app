import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetPowerSamples extends CommandBase implements CommandBaseInterface {

  powerSampleType : PowersampleDataType;
  constructor(handle: string, powerSampleType : PowersampleDataType) {
    super(handle, "getPowerSamples");
    this.powerSampleType = powerSampleType;
  }


  async execute(options: ExecutionOptions) : Promise<PowerSamples[]> {
    return BluenetPromiseWrapper.getPowerSamples(this.handle, this.powerSampleType);
  }
  
}

