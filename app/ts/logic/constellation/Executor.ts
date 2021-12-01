import { MapProvider } from "../../backgroundProcesses/MapProvider";

export const Executor = {

  _aggregateSwitchCommands(
    getState: (bleCommand: BleCommand) => number,
    connectedHandle: string,
    bleCommand: BleCommand,
    queue: CommandQueueMap
  ) : { crownstoneId: number, state: number }[] {
    let stoneSummary  = MapProvider.stoneHandleMap[connectedHandle];
    let crownstoneId  = stoneSummary.cid; // this is the short id (uint8)
    let stoneId       = bleCommand.sphereId;
    let sphereId      = stoneSummary.sphereId;

    let packets = [];
    if (queue.direct[connectedHandle]) {
      for (let command of queue.direct[connectedHandle]) {
        // as long as we're in the same sphere, we might as well try to add it.
        if (command.sphereId === sphereId) {
          if (command.command.type === bleCommand.command.type) {
            let extStoneSummary = MapProvider.stoneHandleMap[command.endTarget];
            let state = getState(command);
            if (state !== undefined) {
              packets.push({ crownstoneId: stoneSummary.cid, state: getState(command) });
            }
          }
        }
      }
    }

    // loop over all commands that are shared and in this sphere, get the ones with the TURN_ON command
    // We only check mesh commands, since anything that is direct and allowed to be relayed via the mesh is loaded there.
    for (let sphereId in queue.mesh) {
      for (let command of queue.mesh[sphereId]) {
        // as long as we're in the same sphere, we might as well try to add it.
        if (command.sphereId === sphereId) {
          if (command.command.type === bleCommand.command.type && command.endTarget && command.endTarget !== connectedHandle) {
            let extStoneSummary = MapProvider.stoneHandleMap[command.endTarget];
            let state = getState(command);
            if (state !== undefined) {
              packets.push({ crownstoneId: extStoneSummary.cid, state: getState(command) });

              // if this is in the same mesh as the connected Crownstone, allow this to be added to the attempting-by, if it's not already done
              if (
                stoneSummary.sphereId === sphereId &&
                bleCommand.attemptingBy.indexOf(connectedHandle) === -1 &&
                bleCommand.executedBy.indexOf(connectedHandle)   === -1
              ) {
                bleCommand.attemptingBy.push(connectedHandle);
              }
            }
          }
        }
      }
    }

    return packets;
  },

  aggregateTurnOnCommands(connectedHandle: string, bleCommand: BleCommand, queue: CommandQueueMap) : { crownstoneId: number, state: number }[] {
    return this._aggregateSwitchCommands(() => { return 100; }, connectedHandle, bleCommand, queue);
  },

  aggregateMultiSwitchCommands(connectedHandle, bleCommand: BleCommand, queue: CommandQueueMap) : { crownstoneId: number, state: number }[]  {
    return this._aggregateSwitchCommands(
      (bleCommand) => { if (bleCommand.command.type === "multiSwitch") { return bleCommand.command.state; }}, connectedHandle, bleCommand, queue
    );
  },


  /**
   * This is called when the system is connected to a Crownstone and ready to perform commands
   * @param handle
   * @param bleCommand
   * @param queue
   */
  async runCommand(handle: string, bleCommand: BleCommand, queue: CommandQueueMap) : Promise<{ data: any }> {
    return bleCommand.command.execute(handle, {bleCommand, queue});
  },

}