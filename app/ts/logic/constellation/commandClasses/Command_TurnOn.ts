import { CommandBase } from "./base/CommandBase";
import { BluenetPromiseWrapper } from "../../../native/libInterface/BluenetPromise";
import { Executor } from "../Executor";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";


export class Command_TurnOn extends CommandBase implements BroadcastInterface {

  constructor() {
    super("turnOn");
    this.canBroadcast = true;
  }

  async execute(connectedHandle: string, options: ExecutionOptions) : Promise<void> {
    if (!options) { throw "NO_OPTIONS_PROVIDED"; }
    let stoneSwitchPackets = Executor.aggregateTurnOnCommands(connectedHandle, options.bleCommand, options.queue);
    let stoneIdList = [];
    for (let item of stoneSwitchPackets) {
      stoneIdList.push(item.crownstoneId);
    }
    return BluenetPromiseWrapper.turnOnMesh(connectedHandle, stoneIdList);
  }

  async broadcast(bleCommand: BleCommand) {
    let stoneSummary  = MapProvider.stoneHandleMap[bleCommand.commandTarget];
    let crownstoneId  = stoneSummary.cid; // this is the short id (uint8)

    return BluenetPromiseWrapper.turnOnBroadcast(bleCommand.sphereId, crownstoneId, false)
  }

  isDuplicate(otherCommand: CommandBaseInterface): boolean {
    if (this.type === otherCommand.type || otherCommand.type === "multiSwitch") {
      return true;
    }
    return false;
  }

}
