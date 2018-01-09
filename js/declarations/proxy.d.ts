interface BluenetPromiseWrapperProtocol {
  clearTrackedBeacons()                         : Promise< void >,
  commandFactoryReset()                         : Promise< void >,
  connect(handle: string)                       : Promise< void >,
  disconnectCommand()                           : Promise< void >,
  getMACAddress()                               : Promise< string >,
  getFirmwareVersion()                          : Promise< string >,
  getBootloaderVersion()                        : Promise< string >,
  getHardwareVersion()                          : Promise< string >,
  finalizeFingerprint(sphereId: string, locationId: string): Promise< void >,
  isReady()                                     : Promise< void >,
  keepAlive()                                   : Promise< void >,
  keepAliveState(changeState : boolean, state : number, timeout: number): Promise< void >,
  phoneDisconnect()                             : Promise< void >,
  toggleSwitchState()                           : Promise< void >,
  setSwitchState(state: number)                 : Promise< void >,
  setupCrownstone(dataObject)                   : Promise< void >,
  setSettings(dataObject)                       : Promise< void >,
  requestLocation()                             : Promise< locationType >,
  recover(handle: string)                       : Promise< void >,
  clearFingerprintsPromise()                    : Promise< void >,

  // Mesh
  meshKeepAlive()                                                 : Promise< void >,
  meshKeepAliveState(timeout: number, stoneKeepAlivePackets: any) : Promise< void >,
  multiSwitch(arrayOfStoneSwitchPackets: any[])                   : Promise< void >,

  // DFU
  putInDFU()                                    : Promise< void >,
  setupPutInDFU()                               : Promise< void >,
  performDFU(handle : string, uri: string )     : Promise< void >,
  setupFactoryReset()                           : Promise< void >,
  bootloaderToNormalMode( handle : string )     : Promise< void >,

  // new
  getErrors()                                   : Promise< errorData >,
  clearErrors(clearErrorJSON : clearErrorData)  : Promise< void >,
  restartCrownstone()                           : Promise< void >,
  setTime(time : number)                        : Promise< void >,
  getTime()                                     : Promise< number >, // timestamp in seconds since epoch

  addSchedule(data : bridgeScheduleEntry)       : Promise< void >,
  setSchedule(data : bridgeScheduleEntry)       : Promise< void >,
  clearSchedule(scheduleEntryIndex : number)    : Promise< void >,
  getAvailableScheduleEntryIndex()              : Promise< number >,
  getSchedules()                                : Promise< [bridgeScheduleEntry] >,
}

interface crownstoneServiceData {
  opCode                    : number
  dataType                  : number
  stateOfExternalCrownstone : boolean
  hasError                  : boolean
  setupMode                 : boolean
  crownstoneId              : number,
  switchState               : number,
  flagsBitmask              : number,
  temperature               : number,
  powerFactor               : number,
  powerUsageReal            : number,
  powerUsageApparent        : number,
  accumulatedEnergy         : number,
  timestamp                 : number,
  dimmingAvailable          : boolean,
  dimmingAllowed            : boolean,
  switchLocked              : boolean,
  errorMode                 : boolean,
  errors                    : errorData,
  uniqueElement             : number
}

interface crownstoneAdvertisement {
  handle              : string,
  name                : string,
  rssi                : number,
  referenceId         : string,
  isCrownstoneFamily  : boolean,
  isCrownstonePlug    : boolean,
  isCrownstoneBuiltin : boolean,
  isGuidestone        : boolean,
  isInDFUMode         : boolean,
  serviceUUID         : string,
  serviceData         : crownstoneServiceData
}


interface ibeaconPackage {
  id    : string,
  uuid  : string,
  major : string,
  minor : string,
  distance  : number,
  rssi  : number,
  referenceId  : string,
}


// expected response from getErrors
interface errorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
  bitMask           : number
}

interface clearErrorData {
  overCurrent       : boolean
  overCurrentDimmer : boolean
  temperatureChip   : boolean
  temperatureDimmer : boolean
  dimmerOnFailure   : boolean
  dimmerOffFailure  : boolean
}

interface locationType {
  latitude:  number,
  longitude: number,
}