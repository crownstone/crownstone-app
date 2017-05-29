interface BluenetPromiseWrapperProtocol {
  clearTrackedBeacons(): Promise<void>,
  commandFactoryReset(): Promise<void>,
  connect(handle: string): Promise<void>,
  disconnectCommand(): Promise<void>,
  getMACAddress(): Promise<string>,
  getFirmwareVersion(): Promise<string>,
  getBootloaderVersion(): Promise<string>,
  getHardwareVersion(): Promise<string>,
  finalizeFingerprint(sphereId: string, locationId: string): Promise<void>,
  isReady(): Promise<void>,
  keepAlive(): Promise<void>,
  keepAliveState(changeState : boolean, state : number, timeout: number): Promise<void>,
  phoneDisconnect(): Promise<void>,
  toggleSwitchState(): Promise<void>,
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
  setupPutInDFU(): Promise<void>,
  performDFU(handle : string, uri: string ): Promise<void>,
  setupFactoryReset(): Promise<void>,
  bootloaderToNormalMode( handle : string ): Promise<void>,
  getErrors(): Promise<any>,
  clearErrors(clearErrorJSON): Promise<any>,
  restartCrownstone(): Promise<any>,
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
  hasError          : boolean,
  stateOfExternalCrownstone: boolean,
  setupMode         : boolean,
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
  isInDFUMode         : boolean,
  serviceUUID       : string,
  serviceData       : crownstoneServiceData
}

