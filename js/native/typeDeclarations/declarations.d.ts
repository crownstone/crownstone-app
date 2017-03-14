interface keepAlivePayload {
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}

interface keepAliveStatePayload {
  handle: string,
  crownstoneId: string,
  changeState: boolean,
  state: number,
  timeout: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}


interface setSwitchStatePayload {
  handle: string,
  crownstoneId: string,
  state: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}


interface multiSwitchPayload {
  handle: string,
  crownstoneId: string,
  state: number,
  intent: number,
  timeout: number,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}

interface sphereMeshNetworks  {
  [propName: string] : meshNetworks
}

interface meshNetworks  {
  [propName: number] : meshTodo
}

interface connectionInfo  {
  sphereId : string,
  handle : string,
  stoneId : string,
}

interface stoneObject  {
  stone : any,
  stoneId : string,
}

interface meshTodo {
  keepAlive:      keepAlivePayload[],
  keepAliveState: keepAliveStatePayload[],
  setSwitchState: setSwitchStatePayload[],
  multiSwitch:    multiSwitchPayload[],
  other:          any[]
}

type commandInterface = { commandName: 'keepAlive' } |
  { commandName : 'keepAliveState', state : number, timeout : number, changeState : boolean } |
  { commandName : 'setSwitchState', state : number } |
  { commandName : 'multiSwitch', state : number, timeout : number, intent: number }


interface batchCommands  {
  [propName: string] : batchCommandEntry
}

interface directCommands  {
  [propName: string] : batchCommandEntry[]
}

interface batchCommandEntry {
  handle:   string,
  sphereId: string,
  stoneId:  string,
  stone:    any,
  attempts: number,
  command:  commandInterface,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}