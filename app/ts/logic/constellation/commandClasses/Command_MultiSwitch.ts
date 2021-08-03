import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";


export class Command_MultiSwitch extends CommandBase implements BroadcastInterface {

  state:  number;
  constructor(state: number) {
    super("multiSwitch");
    this.state = state;
    this.canBroadcast = true;
  }


  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    if (!options) { throw new Error("NO_OPTIONS_PROVIDED"); }
    let stoneSwitchPackets = Executor.aggregateMultiSwitchCommands(connectedHandle, options.bleCommand, options.queue);
    return BluenetPromiseWrapper.multiSwitch(connectedHandle, stoneSwitchPackets);
  }

  async broadcast(bleCommand: BleCommand) {
    let stoneSummary  = MapProvider.stoneHandleMap[bleCommand.commandTarget];
    let crownstoneId  = stoneSummary.cid; // this is the short id (uint8)

    return BluenetPromiseWrapper.broadcastSwitch(bleCommand.sphereId, crownstoneId, this.state, false)
  }

  isDuplicate(otherCommand: CommandBaseInterface): boolean {
    if (this.type === otherCommand.type || otherCommand.type === "turnOn") {
      return true;
    }
    return false;
  }
}
