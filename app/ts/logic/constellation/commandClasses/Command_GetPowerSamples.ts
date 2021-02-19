import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_GetPowerSamples extends CommandBase implements CommandBaseInterface {

  powerSampleType : PowersampleDataType;
  constructor(powerSampleType : PowersampleDataType) {
    super("getPowerSamples");
    this.powerSampleType = powerSampleType;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<PowerSamples[]> {
    return BluenetPromiseWrapper.getPowerSamples(connectedHandle, this.powerSampleType);
  }
  
}

