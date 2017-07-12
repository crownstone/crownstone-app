interface keepAlivePayload {
  attempts: number,
  initialized: boolean,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?)  : void,
    pending: boolean
  }
}

interface keepAliveStatePayload {
  handle: string,
  crownstoneId: string,
  changeState: boolean,
  state: number,
  initialized: boolean,
  timeout: number,
  attempts: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?)  : void,
    pending: boolean
  }
}

interface multiSwitchPayload {
  handle: string,
  crownstoneId: string,
  state: number,
  intent: number,
  initialized: boolean,
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
  sphereId : string,
  stoneId: string,
  stone: any,
  meshNetworkId?: string,
  handle : string,
}

interface meshTodo {
  keepAlive:      keepAlivePayload[],
  keepAliveState: keepAliveStatePayload[],
  multiSwitch:    multiSwitchPayload[],
  other:          any[]
}

type commandInterface = { commandName: 'keepAlive' } |
  { commandName : 'keepAliveState', state : number, timeout : number, changeState : boolean } |
  { commandName : 'setSwitchState', state : number } |
  { commandName : 'multiSwitch', state : number, timeout : number, intent: number } |
  { commandName : 'getFirmwareVersion' } |
  { commandName : 'getHardwareVersion' } |
  { commandName : 'keepAliveBatchCommand' } |
  { commandName : 'getErrors' } |
  { commandName : 'getTime' } |
  { commandName : 'setTime', time: number } |
  { commandName : 'clearErrors', clearErrorJSON: any } |
  { commandName : 'clearSchedule', scheduleEntryIndex: number } |
  { commandName : 'getAvailableScheduleEntryIndex' } |
  { commandName : 'setSchedule', scheduleConfig: bridgeScheduleEntry } |
  { commandName : 'addSchedule', scheduleConfig: bridgeScheduleEntry }


interface batchCommands  {
  [propName: string] : batchCommandEntry
}

// keys are sphereIds
interface directCommands  {
  [propName: string] : batchCommandEntry[]
}

interface batchCommandEntry {
  priority: boolean,
  handle:   string,
  sphereId: string,
  stoneId:  string,
  stone:    any,
  initialized: boolean,
  attempts: number,
  command:  commandInterface,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?) : void,
    pending: boolean,
  }
}
