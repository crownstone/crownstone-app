import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_MultiSwitch extends CommandBase implements CommandBaseInterface {

  state:  number;
  constructor(state: number) {
    super("multiSwitch");
    this.state = state;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    if (!options) { throw "NO_OPTIONS_PROVIDED"; }
    let stoneSwitchPackets = Executor.aggregateMultiSwitchCommands(connectedHandle, options.bleCommand, options.queue);
    return BluenetPromiseWrapper.multiSwitch(connectedHandle, stoneSwitchPackets);
  }

  isDuplicate(otherCommand: CommandBaseInterface): boolean {
    if (this.type === otherCommand.type || otherCommand.type === "turnOn") {
      return true;
    }
    return false;
  }
}
