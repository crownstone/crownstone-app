type CrownstoneMode = "unknown" | "setup" | "operation" | "dfu";

// this is used in the stone datamodel to denote the type
type StoneType      = "UNKNOWN"        |
                      "PLUG"           |
                      "BUILTIN"        |
                      "BUILTIN_ONE"    |
                      "GUIDESTONE"     |
                      "CROWNSTONE_USB" |
                      "CROWNSTONE_HUB" |
                      "SOCKET_F"       |
                      "PROTOTYPE_RELAY_DIMMER" |
                      "PROTOTYPE_RELAY"        |
                      "PROTOTYPE_NO_SWITCHING";

// this comes from the libs
type DeviceType     = 'undefined'              |
                      'plug'                   |
                      'guidestone'             |
                      'builtin'                |
                      'crownstoneUSB'          |
                      'builtinOne'             |
                      'hub'                    |
                      'socketF'                |
                      'prototype_relay_dimmer' |
                      'prototype_relay'        |
                      'prototype_no_switching';

type handle         = string;
/**
 * All methods which will send a command to a Crownstone and fail due to there not being a connection will throw error "NOT_CONNECTED"
 *
 * All methods which broadcast and are overwritten by the library (due to duplicate handling, or other reasons) will throw "BROADCAST_ABORTED"
 * Broadcasts are given 1.5s airtime total, each 0.25s, the broadcast payload updates to cycle packets that want to be broadcasted.
 * When the broadcast has had it's 1.5s airtime, the promise will resolve.
 */

interface BluenetPromiseWrapperProtocol {
  /**
   * Stop tracking ibeacons
   */
  clearTrackedBeacons()                                                 : Promise< void >,

  /**
   * This method assumes there is a connection to this Crownstone, it performs a factory reset via command
   * It leaves the Crownstone disconnected.
   * It can throw an error COULD_NOT_FACTORY_RESET if the return code is not success
   */
  commandFactoryReset(handle: handle)                                   : Promise< void >,

  /**
   * This will connect to the Crownstone and return the mode. Possible modes are typed in CrownstoneMode.
   * If the connection is cancelled by the cancelConnectionRequest method, the error "CONNECTION_CANCELLED" is thrown
   * Other errors will be treated as bugs to solve (for now).
   *
   * @param handle           Handle or MAC address.
   * @param referenceId      The sphere ID.
   * @param highPriority
   */
  connect(handle: handle, referenceId: string, highPriority?: boolean)  : Promise< CrownstoneMode >,

  /**
   * Cancels a connection request to the handle. Will return immediately and will not throw errors.
   * @param handle
   */
  cancelConnectionRequest(handle: handle)                               : Promise< void >,

  /**
   * This sends the disconnect command to the Crownstone and performs a phoneDisconnect afterwards.
   * Leaves the Crownstone disconnected. Will not throw errors.
   * @param handle
   */
  disconnectCommand(handle: handle)                                     : Promise< void >,

  getMACAddress(handle: handle)                                         : Promise< string >,
  getFirmwareVersion(handle: handle)                                    : Promise< string >,
  getBootloaderVersion(handle: handle)                                  : Promise< string >,
  getHardwareVersion(handle: handle)                                    : Promise< string >,

  /**
   * Returns when the BLE central has initialized (ready to scan/perform connections after boot)
   */
  isReady()                                                             : Promise< void >,
  isPeripheralReady()                                                   : Promise< void >,

  /**
   * Disconnect from the Crownstone from the phone's side. Used for Crownstones that are not in operation mode. Will not throw errors.
   * @param handle
   */
  phoneDisconnect(handle: handle)                                       : Promise< void >,


  toggleSwitchState(handle: handle, stateForOn)                         : Promise< number >,

  /**
   * Setups a Crownstone. Will leave the Crownstone disconnected and setupped.
   * @param handle
   * @param dataObject
   */
  setupCrownstone(handle: handle, dataObject: setupData)                : Promise< void >,
  requestLocation()                                                     : Promise< locationType >,
  recover(handle: handle)                                               : Promise< void >,
  setKeySets(keySets)                                                   : Promise< void >,

  // Mesh
  multiSwitch(handle: handle, arrayOfStoneSwitchPackets: any[])         : Promise< void >,

  // DFU
  /**
   * Will write the command to put in DFU mode. Will not directly disconnect from the Crownstone
   * @param handle
   */
  putInDFU(handle: handle)                                              : Promise< void >,
  /**
   * Same as putInDFU
   * @param handle
   */
  setupPutInDFU(handle: handle)                                         : Promise< void >,
  performDFU(handle: handle, uri: string)                               : Promise< void >,

  /**
   * This will connect to the Crownstone, resolve if the Crownstone is NOT in dfu mode, try to start it in normal mode and leave disconnected.
   * Does not check if the new mode is operation mode.
   * @param handle
   */
  bootloaderToNormalMode(handle: handle)                                : Promise< void >,

  clearErrors(handle: handle, clearErrorJSON : clearErrorData)          : Promise< void >,
  restartCrownstone(handle: handle)                                     : Promise< void >,
  setTime(handle: handle, time : number)                                : Promise< void >,

  /**
   * Set time via broadcast.
   * 
   * @param time
   * @param sunriseSecondsSinceMidnight
   * @param sunsetSecondsSinceMidnight
   * @param referenceId                     The sphere ID.
   * @param enableTimeBasedNonce
   */
  setTimeViaBroadcast(
    time : number,
    sunriseSecondsSinceMidnight: number,
    sunsetSecondsSinceMidnight: number,
    referenceId: string,
    enableTimeBasedNonce: boolean
  )                                                                     : Promise< void >,
  meshSetTime(handle: handle, time : number)                            : Promise< void >,
  getTime(handle: handle)                                               : Promise< number >, // timestamp in seconds since epoch

  getSwitchState(handle: handle)                                        : Promise< number >,
  setSwitchState(handle: handle, state: number)                         : Promise< void >,
  lockSwitch(handle: handle, lock : Boolean)                            : Promise< void >,
  allowDimming(handle: handle, allow: Boolean)                          : Promise< void >,
  setSwitchCraft(handle: handle, state: Boolean)                        : Promise< void >,

  sendNoOp(handle: handle)                                              : Promise< void >,
  sendMeshNoOp(handle: handle)                                          : Promise< void >,

  getTrackingState()                                                    : Promise< trackingState >,
  isDevelopmentEnvironment()                                            : Promise< boolean >,
  setupPulse(handle: handle)                                            : Promise< void >,
  checkBroadcastAuthorization()                                         : Promise< string >,

  /**
   * Broadcast switch.
   * 
   * @param referenceId                     The sphere ID.
   * @param stoneId
   * @param switchState
   * @param autoExecute
   */
  broadcastSwitch(referenceId, stoneId, switchState, autoExecute)       : Promise< void >,

  /**
   * Broadcast behaviour settings.
   * 
   * @param referenceId                     The sphere ID.
   * @param enabled
   */
  broadcastBehaviourSettings(referenceId, enabled:boolean)              : Promise< void >,

  addBehaviour(handle: handle, behaviour: behaviourTransfer)            : Promise<behaviourReply>,
  updateBehaviour(handle: handle, behaviour: behaviourTransfer)         : Promise<behaviourReply>,
  removeBehaviour(handle: handle, index: number)                        : Promise<behaviourReply>,
  getBehaviour(handle: handle, index: number)                           : Promise<behaviourTransfer>,

  setTapToToggle(handle: handle, enabled: boolean)                      : Promise<void>,
  setTapToToggleThresholdOffset(handle: handle, rssiThresholdOffset: number): Promise<void>,
  getTapToToggleThresholdOffset(handle: handle)                         : Promise< number >,
  setSoftOnSpeed(handle: handle, speed: number)                         : Promise< void >,
  getSoftOnSpeed(handle: handle)                                        : Promise< number >,

  syncBehaviours(handle: handle, behaviours: behaviourTransfer[])       : Promise<behaviourTransfer[]>,
  getBehaviourMasterHash(behaviours: behaviourTransfer[])               : Promise<number>,
  getBehaviourMasterHashCRC(behaviours: behaviourTransfer[])            : Promise<number>,

  /**
   * If this returns true, we will not use the registerDevice/trackingNumbers/heartbeats but expect that the
   * device will broadcast its location changes in the background. This payload needs to be updated in the background as well.
   */
  canUseDynamicBackgroundBroadcasts()                                   : Promise<boolean>,

  // dev
  switchRelay(handle: handle, state: number)                            : Promise< void >,
  switchDimmer(handle: handle, state: number)                           : Promise< void >,
  getResetCounter(handle: handle)                                       : Promise< number >,
  getSwitchcraftThreshold(handle: handle)                               : Promise< number >,
  setSwitchcraftThreshold(handle: handle, value: number)                : Promise< void >,
  getMaxChipTemp(handle: handle)                                        : Promise< number >,
  setMaxChipTemp(handle: handle, value: number)                         : Promise< void >,
  getDimmerCurrentThreshold(handle: handle)                             : Promise< number >,
  setDimmerCurrentThreshold(handle: handle, value: number)              : Promise< void >,
  getDimmerTempUpThreshold(handle: handle)                              : Promise< number >,
  setDimmerTempUpThreshold(handle: handle, value: number)               : Promise< void >,
  getDimmerTempDownThreshold(handle: handle)                            : Promise< number >,
  setDimmerTempDownThreshold(handle: handle, value: number)             : Promise< void >,
  getVoltageZero(handle: handle)                                        : Promise< number >,
  setVoltageZero(handle: handle, value: number)                         : Promise< void >,
  getCurrentZero(handle: handle)                                        : Promise< number >,
  setCurrentZero(handle: handle, value: number)                         : Promise< void >,
  getPowerZero(handle: handle)                                          : Promise< number >,
  setPowerZero(handle: handle, value: number)                           : Promise< void >,
  getVoltageMultiplier(handle: handle)                                  : Promise< number >,
  setVoltageMultiplier(handle: handle, value: number)                   : Promise< void >,
  getCurrentMultiplier(handle: handle)                                  : Promise< number >,
  setCurrentMultiplier(handle: handle, value: number)                   : Promise< void >,
  setUartState(handle: handle, value: 0 | 1 | 3)                        : Promise< number >,
  getBehaviourDebugInformation(handle: handle)                          : Promise< behaviourDebug >,

  turnOnMesh(handle: handle, arrayOfStoneIds: number[])                 : Promise< void >,

  /**
   * Broadcast turn on.
   * 
   * @param referenceId                     The sphere ID.
   * @param stoneId
   * @param autoExecute
   */
  turnOnBroadcast(referenceId, stoneId, autoExecute)                    : Promise< void >,
  setSunTimesViaConnection(handle: handle, sunriseSecondsSinceMidnight : number, sunsetSecondsSinceMidnight : number) : Promise< void >,

  registerTrackedDevice(
    handle: handle,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  trackedDeviceHeartbeat(
    handle: handle,
    trackingNumber:number,
    locationUID:number,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  /**
   * Broadcast update tracked device.
   * 
   * @param referenceId                     The sphere ID.
   */
  broadcastUpdateTrackedDevice(
    referenceId: string,
    trackingNumber:number,
    locationUID:number,
    profileId:number,
    rssiOffset:number,
    ignoreForPresence:boolean,
    tapToToggleEnabled:boolean,
    deviceToken:number,
    ttlMinutes:number)                                                  : Promise< void >,

  getCrownstoneUptime(handle: handle)                                   : Promise<number>,
  getMinSchedulerFreeSpace(handle: handle)                              : Promise<number>,
  getLastResetReason(handle: handle)                                    : Promise<ResetReason>,
  getGPREGRET(handle: handle)                                           : Promise<GPREGRET[]>,
  getAdcChannelSwaps(handle: handle)                                    : Promise<AdcSwapCount>,
  getAdcRestarts(handle: handle)                                        : Promise<AdcRestart>,
  getSwitchHistory(handle: handle)                                      : Promise<SwitchHistory[]>,
  getPowerSamples(handle: handle, type : PowersampleDataType)           : Promise<PowerSamples[]>,

  getUICR(handle: handle)                                               : Promise<UICRData>,

  setDoubleTapSwitchcraft(handle: handle, enabled:boolean)              : Promise<void>,
  setDefaultDimValue(handle: handle, dimValue: number)                  : Promise<void>,

  setUartKey(handle: handle, uartKey: string)                           : Promise<void>,

  // all methods that use the hubData pathway, can be rejected with error "HUB_REPLY_TIMEOUT" if the response in not quick enough.
  transferHubTokenAndCloudId(handle: handle, hubToken: string, cloudId: string) : Promise<HubDataReply>,
  requestCloudId(handle: handle)                                        : Promise<HubDataReply>,
  factoryResetHub(handle: handle)                                       : Promise<HubDataReply>,
  factoryResetHubOnly(handle: handle)                                   : Promise<HubDataReply>,
  getLaunchArguments()                                                  : Promise<Record<string, string>>,
}

interface CrownstoneNames {
  [sphereId: sphereId]: {
    [stoneUID: string]: string
  }
}

/** These methods are fire and forget **/
interface BridgeInterface extends BluenetPromiseWrapperProtocol {
  addListener:                            () =>  void,
  batterySaving:                          (state: boolean) =>  void,
  broadcastExecute:                       () =>  void,
  clearLogs:                              () =>  void,
  clearKeySets:                           () =>  void,
  crash:                                  () =>  void,
  enableLoggingToFile:                    (enableLogging: boolean) =>  void,
  enableExtendedLogging:                  (enableLogging: boolean) =>  void,
  getConstants:                           () =>  void,
  gotoOsAppSettings:                      () =>  void,
  gotoOsLocationSettings:                 () =>  void,
  initBroadcasting:                       () =>  void,
  quitApp:                                () =>  void,
  pauseTracking:                          () =>  void,
  removeListeners:                        () =>  void,
  requestEnableBle:                       () =>  void,
  requestBleState:                        () =>  void,
  requestLocationPermission:              () =>  void,
  rerouteEvents:                          () =>  void,
  resetBle:                               () =>  void,
  resumeTracking:                         () =>  void,
  setBackgroundScanning:                  (state: boolean) =>  void,
  setCrownstoneNames:                     (names: CrownstoneNames) =>  void,
  setDevicePreferences:                   (rssiOffset: number, tapToToggle: boolean, ignoreForBehaviour: boolean, randomDeviceToken: number, useTimeBasedNonce: boolean) =>  void,
  setLocationState:                       (sphereUID: number, locationUID: number, profileId: number, deviceToken: number, sphereId: sphereId) =>  void,
  setSunTimes:                            (sunriseSecondsSinceMidnight: number, sundownSecondsSinceMidnight: number, sphereId: sphereId) =>  void,
  setupFactoryReset:                      (hanlde: handle, callback: callback) =>  void,

  startAdvertising:                       () =>  void,
  stopAdvertising:                        () =>  void,

  startScanningForCrownstonesUniqueOnly:  () =>  void,
  startScanningForCrownstones:            () =>  void,

  startScanning:                          () =>  void,
  stopScanning:                           () =>  void,

  trackIBeacon:                           (iBeaconUUID: string, sphereId: sphereId) =>  void,
  stopTrackingIBeacon:                    (iBeaconUUID: string) =>  void,

  subscribeToNearest:                     () =>  void,
  subscribeToUnverified:                  () =>  void,
  unsubscribeUnverified:                  () =>  void,
  unsubscribeNearest:                     () =>  void,

  useHighFrequencyScanningInBackground:   (state: boolean) =>  void,
  viewsInitialized:                       () =>  void,
  vibrate:                                (type: vibrationType) => void,
}


interface UICRData {
  board          : number, 
  productType    : number, 
  region         : number, 
  productFamily  : number, 
  reserved1      : number, 

  hardwarePatch  : number, 
  hardwareMinor  : number, 
  hardwareMajor  : number, 
  reserved2      : number, 

  productHousing : number, 
  productionWeek : number, 
  productionYear : number,
  reserved3      : number, 
}

interface GPREGRET {
  counter?:           number,
  brownout?:          boolean,
  dfuMode?:           boolean,
  storageRecovered?:  boolean,
  raw:                number,
}
interface ResetReason {
  resetPin:       boolean,
  watchdog:       boolean,
  softReset:      boolean,
  lockup:         boolean,
  gpio:           boolean,
  lpComp:         boolean,
  debugInterface: boolean,
  nfc:            boolean,
  raw:            number,
}
interface AdcSwapCount {
  swapCount: number,
  timestamp: number,
}
interface AdcRestart {
  restartCount: number,
  timestamp:    number,
}
interface SwitchHistory {
  timestamp:     number,
  switchCommand: number,
  switchState:   number,
  sourceData:    number,
  sourceId:      number,
  sourceType:    number,
  viaMesh:       boolean,
}
interface PowerSamples {
  type:           number,
  index:          number,
  count:          number,
  timestamp:      number,
  delay:          number,
  sampleInterval: number,
  offset:         number,
  multiplier:     number,
  samples:        number[],
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
  storedBehaviours    : boolean[]
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



interface crownstoneServiceData {
  opCode?                   : number, // unencrypted type (optional)
  dataType?                 : number, // encrypted type (optional)
  stateOfExternalCrownstone : boolean,
  alternativeState          : boolean,
  hasError                  : boolean,
  setupMode                 : boolean,
  hubMode                   : boolean,
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

  // alternative state items
  assetFiltersCRC           : number,
  assetFiltersMasterVersion : number,
  behaviourEnabled          : boolean,
  behaviourMasterHash       : number,

  hubData                   : number[],

  uartAlive                 : boolean,
  uartAliveEncrypted        : boolean,
  uartEncryptionRequiredByCrownstone : boolean,
  uartEncryptionRequiredByHub        : boolean,
  hubHasBeenSetup           : boolean,
  hubHasInternet            : boolean,
  hubHasError               : boolean,

  deviceType                : DeviceType,
  rssiOfExternalCrownstone  : number, // Set to 0 when not external service data.
  errorMode                 : boolean, // True when service data is of type error.
  errors                    : errorData, // Has to be correct when errorMode is true.
  uniqueElement             : number // Partial timestamp, counter, etc. Is this required?
}

interface crownstoneAdvertisementSummary {
  handle : handle,
  rssi   : number,
}


interface crownstoneBaseAdvertisement {
  handle              : handle,
  name                : string,
  rssi                : number,
  referenceId         : string, // The sphere ID. Only required when advertisement is validated and crownstone is in normal mode
  isInDFUMode         : boolean,
}


interface crownstoneAdvertisement extends crownstoneBaseAdvertisement {
  serviceData         : crownstoneServiceData // must always be present
}


interface ibeaconPackage {
  id    : string, // uuid + "_Maj:" + string(major) + "_Min:" + string(minor)
  uuid  : string, // this is the iBeacon UUID in uppercase: "E621E1F8-C36C-495A-93FC-0C247A3E6E5F"
  major : string | number, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  minor : string | number, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
  rssi  : number,
  referenceId : string, // The sphere ID, as given in trackIBeacon().
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
  handle    : handle,
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
  referenceId:     string, // The sphere ID.
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
  ibeaconUUID:        string,
  ibeaconMajor:       number,
  ibeaconMinor:       number,
}


interface SetupStoneSummary {
  name: string,
  icon: string,
  type: StoneType,
  rawType: DeviceType,
  handle: string
}
