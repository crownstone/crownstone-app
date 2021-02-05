import { core } from "../../core";
import { MeshHelper } from "../MeshHelper";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { StoneUtil } from "../../util/StoneUtil";
import { LOGe, LOGi } from "../../logging/Log";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { BleCommandQueue } from "./BleCommandQueue";

export const Executor = {

  _aggregateSwitchCommands(getState: (bleCommand: BleCommand) => number, connectedHandle: string, bleCommand: BleCommand, queue: CommandQueueMap) : { crownstoneId: number, state: number }[] {
    let stoneSummary  = MapProvider.stoneHandleMap[connectedHandle];
    let crownstoneId  = stoneSummary.cid; // this is the short id (uint8)
    let stoneId       = bleCommand.options.sphereId;
    let baseMeshId    = stoneSummary.stoneConfig.meshNetworkId;
    let sphereId      = stoneSummary.sphereId;

    let packets = [{ crownstoneId: stoneSummary.cid, state: getState(bleCommand) }];
    // loop over all commands that are public and in this sphere, get the ones with the TURN_ON command
    // We only check mesh commands, since anything that is direct and allowed to be relayed via the mesh is loaded there.
    for (let meshId in queue.mesh) {
      for (let command of queue.mesh[meshId]) {
        // as long as we're in the same sphere, we might as well try to add it.
        if (command.options.sphereId === sphereId) {
          if (command.command.type === bleCommand.command.type && command.options.endTarget) {
            let extStoneSummary = MapProvider.stoneHandleMap[command.options.endTarget];
            let state = getState(command);
            if (state !== undefined) {
              packets.push({ crownstoneId: extStoneSummary.cid, state: getState(command) });

              // if this is in the same mesh as the connected Crownstone, allow this to be added to the attempting-by, if it's not already done
              if (
                baseMeshId === meshId &&
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
    return this._aggregateSwitchCommands(() => { return 100}, connectedHandle, bleCommand, queue);
  },

  aggregateMultiSwitchCommands(connectedHandle, bleCommand: BleCommand, queue: CommandQueueMap) : { crownstoneId: number, state: number }[]  {
    return this._aggregateSwitchCommands((bleCommand) => {
      if (bleCommand.command.type === "multiSwitch") { return bleCommand.command.state; }
    }, connectedHandle, bleCommand, queue);
  },



  /**
   * This is called when the system is connected to a Crownstone and ready to perform commands
   * @param handle
   * @param commandOptions
   * @param bleCommand
   * @param promiseContainer
   */
  async runCommand(handle: string, bleCommand: BleCommand, queue: CommandQueueMap) : Promise<{ data: any }> {
    let stoneSummary  = MapProvider.stoneHandleMap[handle];
    let crownstoneId  = stoneSummary.cid; // this is the short id (uint8)
    let stoneId       = stoneSummary.id;
    let actionPromise = null;

    let command = bleCommand.command;
    
    switch (command.type) {
      case 'getBootloaderVersion':
        actionPromise = BluenetPromiseWrapper.getBootloaderVersion(handle);
        break;
      case 'getFirmwareVersion':
        actionPromise = BluenetPromiseWrapper.getFirmwareVersion(handle);
        break;
      case 'getHardwareVersion':
        actionPromise = BluenetPromiseWrapper.getHardwareVersion(handle);
        break;
      case 'clearErrors':
        actionPromise = BluenetPromiseWrapper.clearErrors(handle, command.clearErrorJSON);
        break;
      case 'meshSetTime':
      case 'setTime':
        let timeToSet = command.time === undefined ? StoneUtil.nowToCrownstoneTime() : command.time;
        actionPromise = BluenetPromiseWrapper.meshSetTime(handle, timeToSet);
        break;
      case 'commandFactoryReset':
        actionPromise = BluenetPromiseWrapper.commandFactoryReset(handle);
        break;
      case 'sendNoOp':
        actionPromise = BluenetPromiseWrapper.sendNoOp(handle);
        break;
      case 'setupPulse':
        actionPromise = BluenetPromiseWrapper.setupPulse(handle);
        break;
      case 'sendMeshNoOp':
        actionPromise = BluenetPromiseWrapper.sendMeshNoOp(handle);
        break;
      case 'lockSwitch':
        actionPromise = BluenetPromiseWrapper.lockSwitch(handle, command.value);
        break;
      case 'setMeshChannel':
        actionPromise = BluenetPromiseWrapper.setMeshChannel(handle, command.channel);
        break;
      case 'turnOn':
        // let stoneSwitchPacket = {crownstoneId: crownstoneId, state: 100};
        let stoneSwitchPackets = this.aggregateTurnOnCommands(handle, queue);
        actionPromise = BluenetPromiseWrapper.turnOnMesh(handle, stoneSwitchPackets);
        break;
      case 'multiSwitch':
        // stoneSwitchPacket = {crownstoneId: crownstoneId, state: command.state};
        stoneSwitchPackets = this.aggregateMultiSwitchCommands(handle, queue);
        actionPromise = BluenetPromiseWrapper.multiSwitch(handle, stoneSwitchPackets);
        break;
      case 'toggle':
        actionPromise = BluenetPromiseWrapper.toggleSwitchState(handle, command.stateForOn || 100);
        break;
      case 'setTapToToggle':
        actionPromise = BluenetPromiseWrapper.setTapToToggle(handle, command.value);
        break;
      case 'setTapToToggleThresholdOffset':
        actionPromise = BluenetPromiseWrapper.setTapToToggleThresholdOffset(handle, command.rssiOffset);
        break;
      case 'setSwitchCraft':
        actionPromise = BluenetPromiseWrapper.setSwitchCraft(handle, command.value);
        break;
      case 'addBehaviour':
        actionPromise = BluenetPromiseWrapper.addBehaviour(handle, command.behaviour);
        break;
      case 'updateBehaviour':
        actionPromise = BluenetPromiseWrapper.updateBehaviour(handle, command.behaviour);
        break;
      case 'removeBehaviour':
        actionPromise = BluenetPromiseWrapper.removeBehaviour(handle, Number(command.index));
        break;
      case 'getBehaviour':
        actionPromise = BluenetPromiseWrapper.getBehaviour(handle, Number(command.index));
        break;
      case 'syncBehaviour':
        actionPromise = BluenetPromiseWrapper.syncBehaviours(handle, command.behaviours);
        break;
      case 'allowDimming':
        actionPromise = BluenetPromiseWrapper.allowDimming(handle, command.value);
        break;
      case 'setSoftOnSpeed':
        actionPromise = BluenetPromiseWrapper.setSoftOnSpeed(handle, command.softOnSpeed);
        break;
      case 'getBehaviourDebugInformation':
        actionPromise = BluenetPromiseWrapper.getBehaviourDebugInformation(handle);
        break;
      case 'getCrownstoneUptime':
        actionPromise = BluenetPromiseWrapper.getCrownstoneUptime(handle);
        break;
      case 'getAdcRestarts':
        actionPromise = BluenetPromiseWrapper.getAdcRestarts(handle);
        break;
      case 'getSwitchHistory':
        actionPromise = BluenetPromiseWrapper.getSwitchHistory(handle);
        break;
      case 'getPowerSamples':
        actionPromise = BluenetPromiseWrapper.getPowerSamples(handle, command.powersampleDataType);
        break;
      case 'getMinSchedulerFreeSpace':
        actionPromise = BluenetPromiseWrapper.getMinSchedulerFreeSpace(handle);
        break;
      case 'getLastResetReason':
        actionPromise = BluenetPromiseWrapper.getLastResetReason(handle);
        break;
      case 'getGPREGRET':
        actionPromise = BluenetPromiseWrapper.getGPREGRET(handle);
        break;
      case 'getAdcChannelSwaps':
        actionPromise = BluenetPromiseWrapper.getAdcChannelSwaps(handle);
        break;
      case 'registerTrackedDevice':
        let locationUID = typeof command.locationUID == "function" ? command.locationUID() : command.locationUID;
        actionPromise = BluenetPromiseWrapper.registerTrackedDevice(
          handle,
          command.trackingNumber,
          locationUID,
          command.profileId,
          command.rssiOffset,
          command.ignoreForPresence,
          command.tapToToggleEnabled,
          command.deviceToken,
          command.ttlMinutes,
        );
        break;
      case 'trackedDeviceHeartbeat':
        locationUID = typeof command.locationUID == "function" ? command.locationUID() : command.locationUID;
        actionPromise = BluenetPromiseWrapper.trackedDeviceHeartbeat(
          handle,
          command.trackingNumber,
          locationUID,
          command.deviceToken,
          command.ttlMinutes,
        );
        break;
      case 'setSunTimes':
        actionPromise = BluenetPromiseWrapper.setSunTimesViaConnection(handle, command.sunriseSecondsSinceMidnight, command.sunsetSecondsSinceMidnight);
        break;
      default:
        LOGe.bch("BatchCommandHandler: Error: COULD NOT PERFORM ACTION", bleCommand);
        throw "FAILED_TO_EXECUTE_COMMAND";
    }

    // if the direct command is performed, clean up the command afterwards.
    if (actionPromise !== null) {
      // clean up by resolving the promises of the items contained in the mesh messages.
      let data = await actionPromise;
      LOGi.bch("BatchCommandHandler:", command.type, "finalized successfully.");
      return {data:data}
    }
  },

}