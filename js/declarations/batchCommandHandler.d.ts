interface bchReturnType {
  data: any,
  viaMesh?: boolean
}


interface multiSwitchPayload {
  handle: string,
  stoneId: string,
  crownstoneId: string,
  commandUuid: string,
  state: number,
  intent: number,
  timestamp: number,
  options: batchCommandEntryOptions,
  timeout: number,
  attempts: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?)  : void,
    pending: boolean
  }
}

// key is sphereId
interface sphereMeshNetworks  {
  [propName: string] : meshNetworks
}

// key is meshNetwork
interface meshNetworks  {
  [propName: number] : meshTodo
}

interface connectionInfo  {
  sphereId :      string,
  stoneId:        string,
  stone:          any,
  meshNetworkId?: string,
  handle :        string,
}

interface meshTodo {
  keepAlive:      keepAlivePayload[],
  keepAliveState: keepAliveStatePayload[],
  multiSwitch:    multiSwitchPayload[]
}

type commandInterface = { type : 'toggle', stateForOn : number } |
  { type : 'multiSwitch', state : number } |
  { type : 'turnOn' } |
  { type : 'getBootloaderVersion' } |
  { type : 'getFirmwareVersion' } |
  { type : 'getHardwareVersion' } |
  { type : 'addBehaviour', behaviour: behaviourTransfer } |
  { type : 'updateBehaviour', behaviour: behaviourTransfer } |
  { type : 'removeBehaviour', index: number } |
  { type : 'getBehaviour', index: number } |
  { type : 'syncBehaviour', behaviours: behaviourTransfer[] } |
  { type : 'commandFactoryReset' } |
  { type : 'sendNoOp' } |
  { type : 'sendMeshNoOp' } |
  { type : 'meshSetTime', time:  number } |
  { type : 'setTime',     time?: number } |
  { type : 'setSunTimes', sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number } |
  { type : 'clearErrors', clearErrorJSON: any } |
  { type : 'lockSwitch',     value: boolean } |
  { type : 'setSwitchCraft', value: boolean } |
  { type : 'allowDimming',   value: boolean } |
  { type : 'setSoftOnSpeed', softOnSpeed: number } |
  { type : 'setTapToToggle', value: boolean } |
  { type : 'setTapToToggleThresholdOffset', rssiOffset: number } |
  { type : 'setMeshChannel', channel: number } |
  { type : 'setupPulse'} |
  { type : 'getBehaviourDebugInformation' } |
  { type : 'getCrownstoneUptime' } |
  { type : 'getAdcRestarts' } |
  { type : 'getMinSchedulerFreeSpace' } |
  { type : 'getLastResetReason' } |
  { type : 'getGPREGRET' } |
  { type : 'getAdcChannelSwaps' } |
  { type : 'getSwitchHistory' } |
  { type : 'getPowerSamples', type: PowersampleDataType } |
  { type : 'registerTrackedDevice',  trackingNumber: number, locationUID: () => number | number, profileId: number, rssiOffset: number, ignoreForPresence: boolean, tapToToggleEnabled: boolean, deviceToken: number, ttlMinutes: number } |
  { type : 'trackedDeviceHeartbeat', trackingNumber: number, locationUID: () => number | number, deviceToken: number, ttlMinutes: number }


type PowersampleDataType = "triggeredSwitchcraft" | "missedSwitchcraft" | "filteredBuffer" | "unfilteredBuffer" | "softFuse"
interface commandSummary {
  stone     : any,
  stoneId   : string,
  sphereId  : string,
  command   : commandInterface,
  priority  : boolean,
  attempts  : number,
  options   : batchCommandEntryOptions,
}


interface batchCommands  {
  [propName: string] : batchCommandEntry
}

// keys are sphereIds
interface directCommands  {
  [propName: string] : batchCommandEntry[]
}

interface batchCommandEntry {
  priority:    boolean,
  handle:      string,
  sphereId:    string,
  stoneId:     string,
  timestamp:   number,
  attempts:    number,
  options:     batchCommandEntryOptions,
  command:     commandInterface,
  commandUuid: string,
  cleanup():   void,
  promise:{
    resolve(any?) : void,
    reject(any?) :  void,
    pending:        boolean,
  }
}

interface batchCommandEntryOptions {
  keepConnectionOpen?: boolean,
  keepConnectionOpenTimeout?: number, // ms
  onlyAllowDirectCommand?: boolean,
  autoExecute?: boolean
}

interface incomingAdvertisementTopics {
  sphereId: string,
  stoneId: string,
  topic: string,
}

interface crownstoneTopicData {
  handle: string,
  stone: any,
  stoneId: stoneId,
  sphereId: sphereId,
  rssi: number,
  meshNetworkId?: string
}

interface targetData {
  [propName: stoneId]: sphereId
}