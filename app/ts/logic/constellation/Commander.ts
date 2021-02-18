import { BroadcastCommandManager } from "../bchComponents/BroadcastCommandManager";
import { SessionManager } from "./SessionManager";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";
import { core } from "../../core";
import { BleCommandQueue } from "./BleCommandQueue";

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

  constructor(commandOptions: commandOptions) {
    this.options = commandOptions;
    this.options.commanderId ??= xUtil.getUUID();
    this.id = this.options.commanderId;
  }

  reconnect() {

  }

  /**
   * If via mesh is enabled, we will trigger a mesh connection request additionally to the direct one.
   * @param command
   * @param viaMesh
   */
  async _load(command : commandInterface, allowMeshRelays: boolean = false) : Promise<any> {
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

  // async setSunTimes(sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number)
  // async meshSetTime(time:  number)
  // async setTime(time?: number)
  // async registerTrackedDevice(
  //   trackingNumber:     number,
  //   locationUID:  () => number | number,
  //   profileId:          number,
  //   rssiOffset:         number,
  //   ignoreForPresence:  boolean,
  //   tapToToggleEnabled: boolean,
  //   deviceToken:        number,
  //   ttlMinutes:         number
  // )
  // async trackedDeviceHeartbeat(
  //   trackingNumber:    number,
  //   locationUID: () => number | number,
  //   deviceToken:       number,
  //   ttlMinutes:        number
  // )
}

/**
 * this commander is used for the direct commands.
 * You can also send meshcommands to the Crownstone directly, thats why it inherits the meshAPI
 */
export class CommandAPI extends CommandMeshAPI {


  async toggle(stateForOn : number) : Promise<void> {
    return this._load({type:"toggle"}, false);
  }

  async multiSwitch(state : number) : Promise<void>  {
    // either broadcast or connect
    let command : commandInterface = {type:"multiSwitch", state: state}
    let alternateCommand = {
      type: 'multiSwitch'

    }
    // if (BroadcastCommandManager.canBroadcast(command)) {
    //   // load in broadcast manager and auto-execute after setImmediate
    // }
    // else {
    return this._load(command, true);
    // }
  }

  async turnOn() : Promise<void>  {
    // either broadcast or connect
    let command : commandInterface = {type: "turnOn"}
    // TODO: add broadcastng to the commanders
    // if (BroadcastCommandManager.canBroadcast(command)) {
    //   // load in broadcast manager and auto-execute after setImmediate
    // }
    // else {
      // load into the commandQueue
      return this._load(command, true);
    // }
  }

  async getBootloaderVersion() : Promise<string> {
    let command : commandInterface = {type:"getBootloaderVersion"};
    return this._load(command);
  }

  async getFirmwareVersion() : Promise<string> {
    let command : commandInterface = {type:"getFirmwareVersion"};
    return this._load(command);

  }

  async getHardwareVersion() : Promise<string> {
    let command : commandInterface = {type:"getHardwareVersion"};
    return this._load(command);

  }

  async addBehaviour(behaviour: behaviourTransfer) : Promise<behaviourReply> {
    let command : commandInterface = {type:"addBehaviour", behaviour: behaviour};
    return this._load(command);
  }

  async updateBehaviour(behaviour: behaviourTransfer) : Promise<behaviourReply> {
    let command : commandInterface = {type:"updateBehaviour", behaviour: behaviour};
    return this._load(command);
  }

  async removeBehaviour(index: number) : Promise<behaviourReply> {
    let command : commandInterface = {type:"removeBehaviour", index: index};
    return this._load(command);
  }

  async getBehaviour(index: number) : Promise<behaviourTransfer> {
    let command : commandInterface = {type:"getBehaviour", index: index};
    return this._load(command);
  }

  async syncBehaviour(behaviours: behaviourTransfer[]) : Promise<behaviourTransfer[]> {
    let command : commandInterface = {type:"syncBehaviour", behaviours: behaviours};
    return this._load(command);
  }

  async commandFactoryReset() : Promise<void> {
    let command : commandInterface = {type:"commandFactoryReset"};
    return this._load(command);
  }

  async sendNoOp() : Promise<void> {
    let command : commandInterface = {type:"sendNoOp"};
    return this._load(command);
  }

  async sendMeshNoOp() : Promise<void> {
    let command : commandInterface = {type:"sendMeshNoOp"};
    return this._load(command);
  }


  async connect() : Promise< CrownstoneMode > {
    
  }

  async cancelConnectionRequest() : Promise< void > {

  }

  async disconnectCommand() : Promise< void > {

  }

  async getMACAddress() : Promise< string > {

  }

  async phoneDisconnect() : Promise< void > {

  }

  async toggleSwitchState(stateForOn) : Promise< number > {

  }

  async setupCrownstone(dataObject: setupData) : Promise< void > {

  }

  async recover() : Promise< void > {

  }


  // DFU
  async putInDFU() : Promise< void > {

  }
  async setupPutInDFU() : Promise< void > {

  }
  async performDFU(uri: string) : Promise< void > {

  }
  async setupFactoryReset() : Promise< void > {

  }
  async bootloaderToNormalMode() : Promise< void > {

  }

  // new
  async clearErrors(clearErrorJSON : clearErrorData) : Promise< void > {

  }
  async restartCrownstone() : Promise< void > {

  }
  async setTime(time : number) : Promise< void > {

  }
  async setTimeViaBroadcast(
    time : number,
    sunriseSecondsSinceMidnight: number,
    sunsetSecondsSinceMidnight: number,
    referenceId: string,
  ) : Promise< void >{

  }
  async meshSetTime(time : number) : Promise< void >{

  }
  async getTime() : Promise< number > {

  } // timestamp in seconds since epoch

  async getSwitchState() : Promise< number > {

  }
  async lockSwitch(lock : Boolean) : Promise< void > {

  }
  async allowDimming(allow: Boolean) : Promise< void > {

  }
  async setSwitchCraft(state: Boolean) : Promise< void > {

  }
  async setupPulse() : Promise< void > {

  }
  async broadcastSwitch(referenceId, stoneId, switchState, autoExecute) : Promise< void > {

  }
  async broadcastBehaviourSettings(referenceId, enabled:boolean) : Promise< void > {

  }
  async setTapToToggle(enabled: boolean) : Promise<void> {

  }
  async setTapToToggleThresholdOffset(rssiThresholdOffset: number) : Promise<void> {

  }
  async getTapToToggleThresholdOffset() : Promise< number > {

  }
  async setSoftOnSpeed(speed: number) : Promise< void > {

  }
  async getSoftOnSpeed() : Promise< number > {

  }
  async syncBehaviours(behaviours: behaviourTransfer[]) : Promise<behaviourTransfer[]> {

  }
  async getBehaviourMasterHash(behaviours: behaviourTransfer[]) : Promise<number> {

  }
  async getBehaviourMasterHashCRC(behaviours: behaviourTransfer[]) : Promise<number> {

  }
  async switchRelay(state: number) : Promise< void > {

  }
  async switchDimmer(state: number) : Promise< void > {

  }
  async getResetCounter() : Promise< number > {

  }
  async getSwitchcraftThreshold() : Promise< number > {

  }
  async setSwitchcraftThreshold(value: number) : Promise< void > {

  }
  async getMaxChipTemp() : Promise< number > {

  }
  async setMaxChipTemp(value: number) : Promise< void > {

  }
  async getDimmerCurrentThreshold() : Promise< number > {

  }
  async setDimmerCurrentThreshold(value: number) : Promise< void > {

  }
  async getDimmerTempUpThreshold() : Promise< number > {

  }
  async setDimmerTempUpThreshold(value: number) : Promise< void > {

  }
  async getDimmerTempDownThreshold() : Promise< number > {

  }
  async setDimmerTempDownThreshold(value: number) : Promise< void > {

  }
  async getVoltageZero() : Promise< number > {

  }
  async setVoltageZero(value: number) : Promise< void > {

  }
  async getCurrentZero() : Promise< number > {

  }
  async setCurrentZero(value: number) : Promise< void > {

  }
  async getPowerZero() : Promise< number > {

  }
  async setPowerZero(value: number) : Promise< void > {

  }
  async getVoltageMultiplier() : Promise< number > {

  }
  async setVoltageMultiplier(value: number) : Promise< void > {

  }
  async getCurrentMultiplier() : Promise< number > {

  }
  async setCurrentMultiplier(value: number) : Promise< void > {

  }
  async setUartState(value: number) : Promise< number > {

  }
  async getBehaviourDebugInformation() : Promise< behaviourDebug > {

  }
  async turnOnMesh(arrayOfStoneSwitchPackets: any[]) : Promise< void > {

  }
  async turnOnBroadcast(referenceId, stoneId, autoExecute) : Promise< void > {

  }
  async setSunTimesViaConnection(
    sunriseSecondsSinceMidnight : number,
    sunsetSecondsSinceMidnight : number) : Promise< void > {

  }
  async registerTrackedDevice(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number) : Promise< void > {

  }
  async trackedDeviceHeartbeat(
    trackingNumber:number,
    locationUID:number,
    deviceToken:number,
    ttlMinutes:number) : Promise< void > {

  }
  async broadcastUpdateTrackedDevice(
    referenceId: string,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number) : Promise< void > {

  }
  async getCrownstoneUptime() : Promise<number> {

  }
  async getMinSchedulerFreeSpace() : Promise<number> {

  }
  async getLastResetReason() : Promise<ResetReason> {

  }
  async getGPREGRET() : Promise<GPREGRET[]> {

  }
  async getAdcChannelSwaps() : Promise<AdcSwapCount> {

  }
  async getAdcRestarts() : Promise<AdcRestart> {

  }
  async getSwitchHistory() : Promise<SwitchHistory[]> {

  }
  async getPowerSamples(type : PowersampleDataType) : Promise<PowerSamples[]> {

  }
  async setUartKey(uartKey: string) : Promise<void> {

  }

  // all methods that use the hubData pathway, can be rejected with error "HUB_REPLY_TIMEOUT" if the response in not quick enough.
  async transferHubTokenAndCloudId(hubToken: string, cloudId: string) : Promise<HubDataReply> {

  }
  async requestCloudId() : Promise<HubDataReply> {

  }
  async factoryResetHub() : Promise<HubDataReply> {

  }
  async factoryResetHubOnly() : Promise<HubDataReply> {

  }
  async end() {

  }
}
