import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_TurnOn extends CommandBase implements CommandBaseInterface {

  state:  number;

  constructor(handle: string) {
    super(handle, "turnOn");
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    if (!options) { throw "NO_OPTIONS_PROVIDED"; }
    let stoneSwitchPackets = Executor.aggregateTurnOnCommands(this.handle, options.bleCommand, options.queue);
    return BluenetPromiseWrapper.turnOnMesh(this.handle, stoneSwitchPackets);
  }

}
