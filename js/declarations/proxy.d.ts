interface BluenetPromiseWrapper {
  clearTrackedBeacons(): Promise<void>,
  isReady(): Promise<void>,
  connect(handle: string): Promise<void>,
  disconnect(): Promise<void>,
  phoneDisconnect(): Promise<void>,
  setSwitchState(state: number): Promise<void>,
  keepAliveState(changeState : boolean, state : number, timeout: number): Promise<void>,
  keepAlive(): Promise<void>,
  getMACAddress(): Promise<string>,
  setupCrownstone(dataObject): Promise<void>,
  setSettings(dataObject): Promise<void>,
  requestLocation(): Promise<any>,
  recover(handle: string): Promise<void>,
  finalizeFingerprint(sphereId: string, locationId: string): Promise<void>,
  commandFactoryReset(): Promise<void>,
  meshKeepAlive(): Promise<void>,
  meshKeepAliveState(timeout: number, stoneKeepAlivePackets: any): Promise<void>,
  meshCommandSetSwitchState(arrayOfIds : number[], state : number): Promise<void>,
  multiSwitch(arrayOfStoneSwitchPackets: any[]): Promise<void>,
}

interface crownstoneServiceData {
  firmwareVersion   : number,
  crownstoneId      : string,
  switchState       : number,
  eventBitmask      : number,
  temperature       : number,
  powerUsage        : number,
  accumulatedEnergy : number,
  newDataAvailable  : boolean,
  stateOfExternalCrownstone: boolean,
  setupMode         : boolean,
  dfuMode           : boolean,
  random            : string
}

interface crownstoneAdvertisement {
  handle            : string,
  name              : string,
  rssi              : number,
  referenceId       : string,
  isCrownstoneFamily  : boolean,
  isCrownstonePlug    : boolean,
  isCrownstoneBuiltin : boolean,
  isGuidestone        : boolean,
  serviceUUID       : string,
  serviceData       : crownstoneServiceData
}

