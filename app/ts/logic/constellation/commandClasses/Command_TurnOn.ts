import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";


export class Command_TurnOn extends CommandBase implements CommandBaseInterface {

  constructor() {
    super("turnOn");
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    if (!options) { throw "NO_OPTIONS_PROVIDED"; }
    let stoneSwitchPackets = Executor.aggregateTurnOnCommands(connectedHandle, options.bleCommand, options.queue);
    return BluenetPromiseWrapper.turnOnMesh(connectedHandle, stoneSwitchPackets);
  }

  isDuplicate(otherCommand: CommandBaseInterface): boolean {
    if (this.type === otherCommand.type || otherCommand.type === "multiSwitch") {
      return true;
    }
    return false;
  }

}
