import { BroadcastCommandManager } from "../bchComponents/BroadcastCommandManager";
import { SessionManager } from "./SessionManager";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";
import { core } from "../../core";
import { BleCommandQueue } from "./BleCommandQueue";
import {
  Command_AddBehaviour,
  Command_AllowDimming,
  Command_BootloaderToNormalMode,
  Command_ClearErrors,
  Command_CommandFactoryReset,
  Command_FactoryResetHub,
  Command_FactoryResetHubOnly,
  Command_GetAdcChannelSwaps,
  Command_GetAdcRestarts,
  Command_GetBehaviour,
  Command_GetBehaviourDebugInformation,
  Command_GetBehaviourMasterHash,
  Command_GetBootloaderVersion,
  Command_GetCrownstoneUptime,
  Command_GetCurrentMultiplier,
  Command_GetCurrentZero,
  Command_GetDimmerCurrentThreshold,
  Command_GetDimmerTempDownThreshold,
  Command_GetDimmerTempUpThreshold,
  Command_GetFirmwareVersion,
  Command_GetGPREGRET,
  Command_GetHardwareVersion,
  Command_GetLastResetReason,
  Command_GetMACAddress,
  Command_GetMaxChipTemp,
  Command_GetMinSchedulerFreeSpace,
  Command_GetPowerSamples,
  Command_GetPowerZero,
  Command_GetResetCounter,
  Command_GetSoftOnSpeed,
  Command_GetSwitchcraftThreshold,
  Command_GetSwitchHistory,
  Command_GetSwitchState,
  Command_GetTapToToggleThresholdOffset,
  Command_GetTime,
  Command_GetVoltageMultiplier,
  Command_GetVoltageZero,
  Command_LockSwitch,
  Command_MultiSwitch,
  Command_PerformDFU,
  Command_PutInDFU,
  Command_Recover,
  Command_RegisterTrackedDevice,
  Command_RemoveBehaviour,
  Command_RequestCloudId,
  Command_RestartCrownstone,
  Command_SendMeshNoOp,
  Command_SendNoOp,
  Command_SetCurrentMultiplier,
  Command_SetCurrentZero,
  Command_SetDimmerCurrentThreshold,
  Command_SetDimmerTempDownThreshold,
  Command_SetDimmerTempUpThreshold,
  Command_SetMaxChipTemp,
  Command_SetPowerZero,
  Command_SetSoftOnSpeed,
  Command_SetSunTimesViaConnection,
  Command_SetSwitchCraft,
  Command_SetSwitchcraftThreshold,
  Command_SetTapToToggle,
  Command_SetTapToToggleThresholdOffset,
  Command_SetTime,
  Command_SetUartKey,
  Command_SetUartState,
  Command_SetupCrownstone,
  Command_SetupFactoryReset,
  Command_SetupPulse,
  Command_SetupPutInDFU,
  Command_SetVoltageMultiplier,
  Command_SetVoltageZero,
  Command_SwitchDimmer,
  Command_SwitchRelay,
  Command_SyncBehaviours,
  Command_Toggle,
  Command_TrackedDeviceHeartbeat,
  Command_TransferHubTokenAndCloudId,
  Command_TurnOn,
  Command_UpdateBehaviour
} from "./commandClasses";

/**
 * The CommandAPI basically wraps all commands that you can send to a Crownstone. It contains a Collector (see below)
 * to provide connections. This is the class that you'll interact with most of all. You can perform multiple
 * commands on the CommandAPI, which are all asynchronous. The command API can choose to send commands via broadcast
 * if possible using the BroadcastCommandManager.
 *
 * The id identifies this command API. It is used to notify open slots belonging to this command API that a new command is available.
 * The privateId is used to ensure that a slot that is requested for this commandAPI will only process commands coming from this api.
 * This is used for setup and other processed which require to have full command over the connection.
 *
 * If the privateId is missing, the connection can be used for state updates like localization, which do not really care which Crownstones
 * get the command.
 */
class CommandAPI_base {
  id : string | null;
  options : commandOptions;

  _connectionRequested : boolean = false;
  _targetConnectionState : { [handle: string] : ConnectionState } = {};

  handle;

  constructor(commandOptions: commandOptions) {
    this.options = commandOptions;
    this.options.commanderId ??= xUtil.getUUID();
    this.id = this.options.commanderId;
    this.handle = this.options.commandTargets[0];
  }

  reconnect() {

  }

  /**
   * If via mesh is enabled, we will trigger a mesh connection request additionally to the direct one.
   * @param command
   * @param viaMesh
   */
  async _load(command : CommandBaseInterface, allowMeshRelays: boolean = false) : Promise<any> {
    return new Promise<any>((resolve, reject) => {
      BleCommandQueue.generateAndLoad(this.options, command, allowMeshRelays,{resolve, reject});

      if (this._connectionRequested === false) {
        // let collector = new Collector();
        // collector.collect(this.options);

        this._connectionRequested = true;
      }
    })
  }
}

class CommandMeshAPI extends CommandAPI_base {

  async setSunTimesViaConnection(
    sunriseSecondsSinceMidnight : number,
    sunsetSecondsSinceMidnight : number) : Promise< void > {
    return this._load(new Command_SetSunTimesViaConnection(this.handle, sunriseSecondsSinceMidnight, sunsetSecondsSinceMidnight));
  }


  async registerTrackedDevice(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number
  ) : Promise< void > {
    return this._load(new Command_RegisterTrackedDevice(this.handle, trackingNumber, locationUID, profileId, rssiOffset, ignoreForPresence, tapToToggleEnabled, deviceToken, ttlMinutes));
  }


  async trackedDeviceHeartbeat(
    trackingNumber:number,
    locationUID:number,
    deviceToken:number,
    ttlMinutes:number) : Promise< void > {
    return this._load(new Command_TrackedDeviceHeartbeat(this.handle, trackingNumber, locationUID, deviceToken, ttlMinutes));
  }


  async setTime(time : number) : Promise< void > {
    // timestamp in seconds since epoch
    return this._load(new Command_SetTime(this.handle, time));
  }
}

/**
 * this commander is used for the direct commands.
 * You can also send meshcommands to the Crownstone directly, thats why it inherits the meshAPI
 */
export class CommandAPI extends CommandMeshAPI {

  async toggle(stateForOn : number) : Promise<void> {
    return this._load(new Command_Toggle(this.handle));
  }

  async multiSwitch(state : number) : Promise<void>  {
    // either broadcast or connect
    // if (BroadcastCommandManager.canBroadcast(command)) {
    //   // load in broadcast manager and auto-execute after setImmediate
    // }
    // else {
    return this._load(new Command_MultiSwitch(this.handle, state), true);
    // }
  }

  async turnOn() : Promise<void>  {
    // either broadcast or connect
    // TODO: add broadcastng to the commanders
    // if (BroadcastCommandManager.canBroadcast(command)) {
    //   // load in broadcast manager and auto-execute after setImmediate
    // }
    // else {
      // load into the commandQueue
      return this._load(new Command_TurnOn(this.handle), true);
    // }
  }

  async getBootloaderVersion() : Promise<string> {
    return this._load(new Command_GetBootloaderVersion(this.handle));
  }

  async getFirmwareVersion() : Promise<string> {
    return this._load(new Command_GetFirmwareVersion(this.handle));
  }

  async getHardwareVersion() : Promise<string> {
    return this._load(new Command_GetHardwareVersion(this.handle));
  }

  async addBehaviour(behaviour: behaviourTransfer) : Promise<behaviourReply> {
    return this._load(new Command_AddBehaviour(this.handle, behaviour));
  }

  async updateBehaviour(behaviour: behaviourTransfer) : Promise<behaviourReply> {
    return this._load(new Command_UpdateBehaviour(this.handle, behaviour));
  }

  async removeBehaviour(index: number) : Promise<behaviourReply> {
    return this._load(new Command_RemoveBehaviour(this.handle, index));
  }

  async getBehaviour(index: number) : Promise<behaviourTransfer> {
    return this._load(new Command_GetBehaviour(this.handle, index));
  }

  async syncBehaviours(behaviours: behaviourTransfer[]) : Promise<behaviourTransfer[]> {
    return this._load(new Command_SyncBehaviours(this.handle, behaviours));
  }

  async commandFactoryReset() : Promise<void> {
    return this._load(new Command_CommandFactoryReset(this.handle));
  }

  async sendNoOp() : Promise<void> {
    return this._load(new Command_SendNoOp(this.handle));
  }

  async sendMeshNoOp() : Promise<void> {
    return this._load(new Command_SendMeshNoOp(this.handle));
  }

  async connect() : Promise< CrownstoneMode > {
    // TODO: implement
  }

  async cancelConnectionRequest() : Promise< void > {
    // TODO: implement
  }

  async disconnectCommand() : Promise< void > {
    // TODO: implement
  }

  async getMACAddress() : Promise< string > {
    return this._load(new Command_GetMACAddress(this.handle));
  }

  async phoneDisconnect() : Promise< void > {
    // TODO: implement
  }

  async setupCrownstone(dataObject: setupData) : Promise< void > {
    return this._load(new Command_SetupCrownstone(this.handle, dataObject));
  }

  async recover() : Promise< void > {
    return this._load(new Command_Recover(this.handle));
  }


  // DFU
  async putInDFU() : Promise< void > {
    return this._load(new Command_PutInDFU(this.handle));
  }
  async setupPutInDFU() : Promise< void > {
    return this._load(new Command_SetupPutInDFU(this.handle));
  }
  async performDFU(uri: string) : Promise< void > {
    return this._load(new Command_PerformDFU(this.handle, uri));
  }
  async setupFactoryReset() : Promise< void > {
    return this._load(new Command_SetupFactoryReset(this.handle));
  }
  async bootloaderToNormalMode() : Promise< void > {
    return this._load(new Command_BootloaderToNormalMode(this.handle));
  }

  // new
  async clearErrors(clearErrorJSON : clearErrorData) : Promise< void > {
    return this._load(new Command_ClearErrors(this.handle, clearErrorJSON));
  }
  async restartCrownstone() : Promise< void > {
    return this._load(new Command_RestartCrownstone(this.handle));
  }
  async getTime() : Promise< number > {
    return this._load(new Command_GetTime(this.handle));
  }

  async getSwitchState() : Promise< number > {
    return this._load(new Command_GetSwitchState(this.handle));

  }
  async lockSwitch(lock : boolean) : Promise< void > {
    return this._load(new Command_LockSwitch(this.handle, lock));
  }
  async allowDimming(allow: boolean) : Promise< void > {
    return this._load(new Command_AllowDimming(this.handle, allow));
  }
  async setSwitchCraft(state: boolean) : Promise< void > {
    return this._load(new Command_SetSwitchCraft(this.handle, state));
  }
  async setupPulse() : Promise< void > {
    return this._load(new Command_SetupPulse(this.handle));
  }
  async setTapToToggle(enabled: boolean) : Promise<void> {
    return this._load(new Command_SetTapToToggle(this.handle, enabled));
  }
  async setTapToToggleThresholdOffset(rssiThresholdOffset: number) : Promise<void> {
    return this._load(new Command_SetTapToToggleThresholdOffset(this.handle, rssiThresholdOffset));
  }
  async getTapToToggleThresholdOffset() : Promise< number > {
    return this._load(new Command_GetTapToToggleThresholdOffset(this.handle));
  }
  async setSoftOnSpeed(speed: number) : Promise< void > {
    return this._load(new Command_SetSoftOnSpeed(this.handle, speed));
  }
  async getSoftOnSpeed() : Promise< number > {
    return this._load(new Command_GetSoftOnSpeed(this.handle));
  }
  async switchRelay(state: number) : Promise< void > {
    return this._load(new Command_SwitchRelay(this.handle, state));
  }
  async switchDimmer(state: number) : Promise< void > {
    return this._load(new Command_SwitchDimmer(this.handle, state));
  }
  async getResetCounter() : Promise< number > {
    return this._load(new Command_GetResetCounter(this.handle));
  }
  async getSwitchcraftThreshold() : Promise< number > {
    return this._load(new Command_GetSwitchcraftThreshold(this.handle));
  }
  async setSwitchcraftThreshold(value: number) : Promise< void > {
    return this._load(new Command_SetSwitchcraftThreshold(this.handle));
  }
  async getMaxChipTemp() : Promise< number > {
    return this._load(new Command_GetMaxChipTemp(this.handle));
  }
  async setMaxChipTemp(value: number) : Promise< void > {
    return this._load(new Command_SetMaxChipTemp(this.handle, value));
  }
  async getDimmerCurrentThreshold() : Promise< number > {
    return this._load(new Command_GetDimmerCurrentThreshold(this.handle));
  }
  async setDimmerCurrentThreshold(value: number) : Promise< void > {
    return this._load(new Command_SetDimmerCurrentThreshold(this.handle, value));
  }
  async getDimmerTempUpThreshold() : Promise< number > {
    return this._load(new Command_GetDimmerTempUpThreshold(this.handle));
  }
  async setDimmerTempUpThreshold(value: number) : Promise< void > {
    return this._load(new Command_SetDimmerTempUpThreshold(this.handle, value));
  }
  async getDimmerTempDownThreshold() : Promise< number > {
    return this._load(new Command_GetDimmerTempDownThreshold(this.handle));
  }
  async setDimmerTempDownThreshold(value: number) : Promise< void > {
    return this._load(new Command_SetDimmerTempDownThreshold(this.handle));
  }
  async getVoltageZero() : Promise< number > {
    return this._load(new Command_GetVoltageZero(this.handle));
  }
  async setVoltageZero(value: number) : Promise< void > {
    return this._load(new Command_SetVoltageZero(this.handle, value));
  }
  async getCurrentZero() : Promise< number > {
    return this._load(new Command_GetCurrentZero(this.handle));
  }
  async setCurrentZero(value: number) : Promise< void > {
    return this._load(new Command_SetCurrentZero(this.handle, value));
  }
  async getPowerZero() : Promise< number > {
    return this._load(new Command_GetPowerZero(this.handle));
  }
  async setPowerZero(value: number) : Promise< void > {
    return this._load(new Command_SetPowerZero(this.handle, value));
  }
  async getVoltageMultiplier() : Promise< number > {
    return this._load(new Command_GetVoltageMultiplier(this.handle));
  }
  async setVoltageMultiplier(value: number) : Promise< void > {
    return this._load(new Command_SetVoltageMultiplier(this.handle, value));
  }
  async getCurrentMultiplier() : Promise< number > {
    return this._load(new Command_GetCurrentMultiplier(this.handle));
  }
  async setCurrentMultiplier(value: number) : Promise< void > {
    return this._load(new Command_SetCurrentMultiplier(this.handle, value));
  }
  async setUartState(value: 0 | 1 | 3) : Promise< number > {
    return this._load(new Command_SetUartState(this.handle, value));
  }
  async getBehaviourDebugInformation() : Promise< behaviourDebug > {
    return this._load(new Command_GetBehaviourDebugInformation(this.handle));
  }

  async getCrownstoneUptime() : Promise<number> {
    return this._load(new Command_GetCrownstoneUptime(this.handle));
  }
  async getMinSchedulerFreeSpace() : Promise<number> {
    return this._load(new Command_GetMinSchedulerFreeSpace(this.handle));
  }
  async getLastResetReason() : Promise<ResetReason> {
    return this._load(new Command_GetLastResetReason(this.handle));
  }
  async getGPREGRET() : Promise<GPREGRET[]> {
    return this._load(new Command_GetGPREGRET(this.handle));
  }
  async getAdcChannelSwaps() : Promise<AdcSwapCount> {
    return this._load(new Command_GetAdcChannelSwaps(this.handle));
  }
  async getAdcRestarts() : Promise<AdcRestart> {
    return this._load(new Command_GetAdcRestarts(this.handle));
  }
  async getSwitchHistory() : Promise<SwitchHistory[]> {
    return this._load(new Command_GetSwitchHistory(this.handle));
  }
  async getPowerSamples(type : PowersampleDataType) : Promise<PowerSamples[]> {
    return this._load(new Command_GetPowerSamples(this.handle, type));
  }
  async setUartKey(uartKey: string) : Promise<void> {
    return this._load(new Command_SetUartKey(this.handle, uartKey));
  }

  // all methods that use the hubData pathway, can be rejected with error "HUB_REPLY_TIMEOUT" if the response in not quick enough.
  async transferHubTokenAndCloudId(hubToken: string, cloudId: string) : Promise<HubDataReply> {
    return this._load(new Command_TransferHubTokenAndCloudId(this.handle, hubToken, cloudId));
  }
  async requestCloudId() : Promise<HubDataReply> {
    return this._load(new Command_RequestCloudId(this.handle));
  }
  async factoryResetHub() : Promise<HubDataReply> {
    return this._load(new Command_FactoryResetHub(this.handle));
  }
  async factoryResetHubOnly() : Promise<HubDataReply> {
    return this._load(new Command_FactoryResetHubOnly(this.handle));
  }
  async end() {

  }
}
