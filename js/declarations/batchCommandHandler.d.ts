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

type commandInterface = { commandName : 'toggle', stateForOn : number } |
  { commandName : 'multiSwitch', state : number } |
  { commandName : 'turnOn' } |
  { commandName : 'getBootloaderVersion' } |
  { commandName : 'getFirmwareVersion' } |
  { commandName : 'getHardwareVersion' } |
  { commandName : 'addBehaviour', behaviour: behaviourTransfer } |
  { commandName : 'updateBehaviour', behaviour: behaviourTransfer } |
  { commandName : 'removeBehaviour', index: number } |
  { commandName : 'getBehaviour', index: number } |
  { commandName : 'syncBehaviour', behaviours: behaviourTransfer[] } |
  { commandName : 'commandFactoryReset' } |
  { commandName : 'sendNoOp' } |
  { commandName : 'sendMeshNoOp' } |
  { commandName : 'getTime' } |
  { commandName : 'meshSetTime', time:  number } |
  { commandName : 'setTime',     time?: number } |
  { commandName : 'setSunTimes', sunriseSecondsSinceMidnight: number, sunsetSecondsSinceMidnight: number } |
  { commandName : 'clearErrors', clearErrorJSON: any } |
  { commandName : 'lockSwitch',     value: boolean } |
  { commandName : 'setSwitchCraft', value: boolean } |
  { commandName : 'allowDimming',   value: boolean } |
  { commandName : 'setSoftOnSpeed', softOnSpeed: number } |
  { commandName : 'setTapToToggle', value: boolean } |
  { commandName : 'setTapToToggleThresholdOffset', rssiOffset: number } |
  { commandName : 'setMeshChannel', channel: number } |
  { commandName : 'setupPulse'} |
  { commandName : 'getBehaviourDebugInformation' } |
  { commandName : 'getCrownstoneUptime' } |
  { commandName : 'getAdcRestarts' } |
  { commandName : 'getSwitchHistory' } |
  { commandName : 'getPowerSamples', type: PowersampleDataType } |
  { commandName : 'registerTrackedDevice',  trackingNumber: number, locationUID: () => number | number, profileId: number, rssiOffset: number, ignoreForPresence: boolean, tapToToggleEnabled: boolean, deviceToken: number, ttlMinutes: number } |
  { commandName : 'trackedDeviceHeartbeat', trackingNumber: number, locationUID: () => number | number, deviceToken: number, ttlMinutes: number }


type PowersampleDataType = "triggeredSwitchcraft" | "missedSwitchcraft" | "filteredBuffer" | "unfilteredBuffer"
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