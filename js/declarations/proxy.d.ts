interface BluenetPromiseWrapper {
  clearTrackedBeacons(): Promise<void>,
  commandFactoryReset(): Promise<void>,
  connect(handle: string): Promise<void>,
  disconnect(): Promise<void>,
  getMACAddress(): Promise<string>,
  getFirmwareVersion(): Promise<string>,
  finalizeFingerprint(sphereId: string, locationId: string): Promise<void>,
  isReady(): Promise<void>,
  keepAlive(): Promise<void>,
  keepAliveState(changeState : boolean, state : number, timeout: number): Promise<void>,
  phoneDisconnect(): Promise<void>,
  setSwitchState(state: number): Promise<void>,
  setupCrownstone(dataObject): Promise<void>,
  setSettings(dataObject): Promise<void>,
  requestLocation(): Promise<any>,
  recover(handle: string): Promise<void>,

  // Mesh
  meshKeepAlive(): Promise<void>,
  meshKeepAliveState(timeout: number, stoneKeepAlivePackets: any): Promise<void>,
  multiSwitch(arrayOfStoneSwitchPackets: any[]): Promise<void>,

  // DFU
  putInDFU(): Promise<void>,
  performDFU(handle : string, uri: string): Promise<void>,
  setupFactoryReset(): Promise<void>,
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

