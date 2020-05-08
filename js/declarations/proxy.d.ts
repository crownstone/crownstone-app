interface BluenetPromiseWrapperProtocol {
  clearTrackedBeacons()                                               : Promise< void >,
  commandFactoryReset()                                               : Promise< void >,
  connect(handle: string, referenceId: string, highPriority?: boolean): Promise< void >,
  disconnectCommand()                                                 : Promise< void >,
  getMACAddress()                               : Promise< string >,
  getFirmwareVersion()                          : Promise< string >,
  getBootloaderVersion()                        : Promise< string >,
  getHardwareVersion()                          : Promise< string >,
  finalizeFingerprint(sphereId: string, locationId: string): Promise< void >,
  isReady()                                     : Promise< void >,
  isPeripheralReady()                           : Promise< void >,
  phoneDisconnect()                             : Promise< void >,
  toggleSwitchState(stateForOn)                 : Promise< number >,
  setupCrownstone(dataObject: setupData)        : Promise< void >,
  requestLocation()                             : Promise< locationType >,
  recover(handle: string)                       : Promise< void >,
  clearFingerprintsPromise()                    : Promise< void >,
  setKeySets(keySets)                           : Promise< void >,

  // Mesh
  multiSwitch(arrayOfStoneSwitchPackets: any[]) : Promise< void >,

  // DFU
  putInDFU()                                    : Promise< void >,
  setupPutInDFU()                               : Promise< void >,
  performDFU(handle : string, uri: string )     : Promise< void >,
  setupFactoryReset()                           : Promise< void >,
  bootloaderToNormalMode( handle : string )     : Promise< void >,

  // new
  clearErrors(clearErrorJSON : clearErrorData)  : Promise< void >,
  restartCrownstone()                           : Promise< void >,
  setSuntimesOnCrownstone(
    sunriseSecondsSinceMidnight: number,
    sunsetSecondsSinceMidnight: number)         : Promise< void >,
  setTime(time : number)                        : Promise< void >,
  setTimeViaBroadcast(
    time : number,
    sunriseSecondsSinceMidnight: number,
    sunsetSecondsSinceMidnight: number,
    referenceId: string,
  )                                             : Promise< void >,
  meshSetTime(time : number)                    : Promise< void >,
  getTime()                                     : Promise< number >, // timestamp in seconds since epoch

  getSwitchState()                              : Promise< number >,
  setSwitchState(state: number)                 : Promise< void >,
  lockSwitch(lock : Boolean)                    : Promise< void >,
  allowDimming(allow: Boolean)                  : Promise< void >,
  setSwitchCraft(state: Boolean)                : Promise< void >,

  sendNoOp()                                    : Promise< void >,
  sendMeshNoOp()                                : Promise< void >,
  setMeshChannel(channel)                       : Promise< void >,

  getTrackingState()                            : Promise< trackingState >,
  isDevelopmentEnvironment()                    : Promise< boolean >,
  setupPulse()                                  : Promise< void >,
  checkBroadcastAuthorization()                 : Promise< string >,

  broadcastSwitch(referenceId, stoneId, switchState, autoExecute):Promise< void >,
  broadcastBehaviourSettings(referenceId, enabled:boolean):Promise< void >,

  addBehaviour(behaviour: behaviourTransfer)    : Promise<behaviourReply>,
  updateBehaviour(behaviour: behaviourTransfer) : Promise<behaviourReply>,
  removeBehaviour(index: number)                : Promise<behaviourReply>,
  getBehaviour(index: number)                   : Promise<behaviourTransfer>,

  setTapToToggle(enabled: boolean)              : Promise<void>,
  setTapToToggleThresholdOffset(rssiThresholdOffset: number): Promise<void>,

  syncBehaviours(behaviours: behaviourTransfer[]): Promise<behaviourTransfer[]>,
  getBehaviourMasterHash(behaviours: behaviourTransfer[]): Promise<number>,

  canUseDynamicBackgroundBroadcasts()           : Promise<boolean>,

  // dev
  switchRelay(state: number)                    : Promise< void >,
  switchDimmer(state: number)                   : Promise< void >,
  getResetCounter()                             : Promise< number >,
  getSwitchcraftThreshold()                     : Promise< number >,
  setSwitchcraftThreshold(value: number)        : Promise< void >,
  getMaxChipTemp()                              : Promise< number >,
  setMaxChipTemp(value: number)                 : Promise< void >,
  getDimmerCurrentThreshold()                   : Promise< number >,
  setDimmerCurrentThreshold(value: number)      : Promise< void >,
  getDimmerTempUpThreshold()                    : Promise< number >,
  setDimmerTempUpThreshold(value: number)       : Promise< void >,
  getDimmerTempDownThreshold()                  : Promise< number >,
  setDimmerTempDownThreshold(value: number)     : Promise< void >,
  getVoltageZero()                              : Promise< number >,
  setVoltageZero(value: number)                 : Promise< void >,
  getCurrentZero()                              : Promise< number >,
  setCurrentZero(value: number)                 : Promise< void >,
  getPowerZero()                                : Promise< number >,
  setPowerZero(value: number)                   : Promise< void >,
  getVoltageMultiplier()                        : Promise< number >,
  setVoltageMultiplier(value: number)           : Promise< void >,
  getCurrentMultiplier()                        : Promise< number >,
  setCurrentMultiplier(value: number)           : Promise< void >,
  setUartState(value: number)                   : Promise< number >,
  getBehaviourDebugInformation()                : Promise< behaviourDebug >,

  turnOnMesh(arrayOfStoneSwitchPackets: any[])  : Promise< void >,
  turnOnBroadcast(referenceId, stoneId, autoExecute)         : Promise< void >,
  setSunTimesViaConnection(sunriseSecondsSinceMidnight : number, sunsetSecondsSinceMidnight : number) : Promise< void >,

  registerTrackedDevice(
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number) : Promise< void >,

  broadcastUpdateTrackedDevice(
    referenceId: string,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number) : Promise< void >,
}


interface behaviourDebug {
  time                : number
  sunrise             : number
  sunset              : number
  overrideState       : number
  behaviourState      : number
  aggregatedState     : number
  dimmerPowered       : number
  behaviourEnabled    : number
  activeBehaviours    : boolean[]
  activeEndConditions : boolean[]
  behavioursInTimeoutPeriod: boolean[]
  presenceProfile_0   : boolean[]
  presenceProfile_1   : boolean[]
  presenceProfile_2   : boolean[]
  presenceProfile_3   : boolean[]
  presenceProfile_4   : boolean[]
  presenceProfile_5   : boolean[]
  presenceProfile_6   : boolean[]
  presenceProfile_7   : boolean[]
  presenceProfile_8   : boolean[]
}

type deviceType = 'undefined' | 'plug' | 'guidestone' | 'builtin' | 'crownstoneUSB' | 'builtinOne'

interface crownstoneServiceData {
  opCode?                   : number, // unencrypted type (optional)
  dataType?                 : number, // encrypted type (optional)
  stateOfExternalCrownstone : boolean,
  alternativeState          : boolean,
  hasError                  : boolean,
  setupMode                 : boolean,
  crownstoneId              : number, // [0 .. 255]
  switchState               : number, // [0 .. 228]
  flagsBitmask?             : number, // bitmask (optional)
  temperature               : number, // °C
  powerFactor               : number, // [-1.0 .. 1.0] __not 0__ (default 1.0)
  powerUsageReal            : number, // W
  powerUsageApparent        : number, // VA
  accumulatedEnergy         : number, // J
  timestamp                 : number, // reconstructed timestamp, -1 if not available, uint16 counter when time is not set

  // bitmask flags
  dimmerReady               : boolean,
  dimmingAllowed            : boolean,
  switchLocked              : boolean,
  timeSet                   : boolean,
  switchCraftEnabled        : boolean,
  tapToToggleEnabled        : boolean,
  behaviourOverridden       : boolean,

  behaviourEnabled          : boolean,
  behaviourMasterHash       : number,

  deviceType                : deviceType,
  rssiOfExternalCrownstone  : number, // Set to 0 when not external service data.
  errorMode                 : boolean, // True when service data is of type error.
  errors                    : errorData, // Has to be correct when errorMode is true.
  uniqueElement             : number // Partial timestamp, counter, etc. Is this required?
}


interface crownstoneAdvertisement {
  handle              : string,
  name                : string,
  rssi                : number,
  referenceId         : string, // Only required when advertisement is validated and crownstone is in normal mode
  isInDFUMode         : boolean,
  serviceData         : crownstoneServiceData // must always be present
}


interface crownstoneBaseAdvertisement {
  handle              : string,
  name                : string,
  rssi                : number,
  referenceId         : string, // Only required when advertisement is validated and crownstone is in normal mode
  isInDFUMode         : boolean,
}


interface ibeaconPackage {
  id    : string, // uuid + "_Maj:" + string(major) + "_Min:" + string(minor)
  uuid  : string, // this is the iBeacon UUID in uppercase: "E621E1F8-C36C-495A-93FC-0C247A3E6E5F"
  major : string, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  minor : string, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
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
  bitMask           : number // For debug
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


interface trackingState {
  isMonitoring: boolean, // this means that the lib thinks is it tracking ibeacons, not perse in range. Methods like pauseTracking would stop monitoring. Is used for diagnostics.
  isRanging:    boolean, // this means at least one ibeacon (that is being monitored) is in range and should be generating ibeacon events. If true, the lib thinks it should be sending events, not if it actually is.
}

interface nearestStone  {
  handle    : string,
  rssi      : number,
  setupMode : boolean
  dfuMode   : boolean
  verified  : boolean
}

interface keySet  {
  adminKey:        string,
  memberKey:       string,
  basicKey:        string,
  localizationKey: string,
  serviceDataKey:  string,
  referenceId:     string,
  iBeaconUuid:     string,
}

interface crownstoneModes {
  setupMode: boolean,
  dfuMode: boolean,
}

interface setupData {
  crownstoneId:       number,
  sphereId:           number,
  adminKey:           string,
  memberKey:          string,
  basicKey:           string,
  localizationKey:    string,
  serviceDataKey:     string,
  meshNetworkKey:     string,
  meshApplicationKey: string,
  meshDeviceKey:      string,
  meshAccessAddress:  string,
  ibeaconUUID:        string,
  ibeaconMajor:       number,
  ibeaconMinor:       number,
}

