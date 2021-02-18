import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_MultiSwitch extends CommandBase implements CommandBaseInterface {

  state:  number;

  constructor(handle: string, state: number) {
    super(handle, "multiSwitch");
    this.state = state;
  }


  async execute(options: ExecutionOptions) : Promise<void> {
    if (!options) { throw "NO_OPTIONS_PROVIDED"; }
    let stoneSwitchPackets = Executor.aggregateMultiSwitchCommands(this.handle, options.bleCommand, options.queue);
    return BluenetPromiseWrapper.multiSwitch(this.handle, stoneSwitchPackets);
  }

}
