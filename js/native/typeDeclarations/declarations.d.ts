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

interface meshNetworks  {
  [propName: number] : meshTodo
}

interface meshTodo {
  keepAlive:      keepAlivePayload[],
  keepAliveState: keepAliveStatePayload[],
  setSwitchState: setSwitchStatePayload[],
  multiSwitch:    multiSwitchPayload[],
  other:          any[]
}

type commandInterface = { command: 'keepAlive' } |
  { command : 'keepAliveState', state : number, timeout : number, changeState : boolean } |
  { command : 'setSwitchState', state : number } |
  { command : 'multiSwitch', state : number, timeout : number, intent: number }


interface batchCommands  {
  [propName: string] : batchCommandEntry
}

interface batchCommandEntry {
  handle: string,
  sphereId: string,
  stoneId: string,
  stone: any,
  command: commandInterface,
  cleanup(): void,
  promise:{
    resolve(any?) : void,
    reject(any?): void
  }
}