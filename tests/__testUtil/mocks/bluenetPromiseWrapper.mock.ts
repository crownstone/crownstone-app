
export function mockBluenetPromiseWrapper() {
  let libStateWrapper = new LibContainer()

  let mocks = {};
  for (let method of targetedMethods) {
    mocks[method] = function() {
      let args = arguments;
      let handle = args[0];
      // console.log("Providing promise",method, handle, arguments)
      return new Promise((resolve, reject) => {
        libStateWrapper.loadTargeted(method, handle, resolve, reject, args)
      })
    }
  }

  jest.mock("../../../app/ts/native/libInterface/BluenetPromise", () => {
    return {
      BluenetPromiseWrapper: mocks
    }
  });

  return libStateWrapper;
}

class LibContainer {

  targetedActions : {[commandName: string]: {[handle: string]: {resolve: (data?: any) => void, reject: (err: any) => void, args: any[]}}} = {}

  reset() {
    for (let [commandName, handleObj] of Object.entries(this.targetedActions)) {
      for (let [handle, promise] of Object.entries(handleObj)) {
        promise.reject("CLEAR")
      }
    }
    this.targetedActions = {};
  }



  loadTargeted(commandName, handle, resolve: (data?: any) => void, reject: (err: any) => void, args: any) {
    if (this.targetedActions[commandName] === undefined) {
      this.targetedActions[commandName] = {};
    }

    // console.log("Promise received", commandName, handle, args)
    if (this.targetedActions[commandName][handle] === undefined) {
      this.targetedActions[commandName][handle] = {resolve, reject, args}
    }
    else {
      throw "ALREADY_IN_TARGETED_ACTIONS"
    }
  }

  for(handle: string) : Resolver {
    return {
      succeed:    this._getSuccessMethods(handle),
      fail:       this._getErrorMethods(handle),
      getArgsFor: this._getArgGetters(handle),
    }
  }

  async cancelConnectionRequest(handle) : Promise<void> {
     this._reject('connect', handle, 'CONNECTION_CANCELLED');
     this._resolve('cancelConnectionRequest', handle)
  }

  has(handle: string) : {called: MockedCallList} {
    return { called: this._getCallMethods(handle) }
  }

  _getCallMethods(handle) : MockedCallList {
    let res = {};
    for (let method of targetedMethods) {
      res[method] = (data: any) => {
        try {
          this._verifyTargetRegistration(method, handle);
        }
        catch (e) { return false; }
        return true;
      }
    }
    // @ts-ignore
    return res
  }

  _getArgGetters(handle) : MockedLibArgs {
    let res = {};
    for (let method of targetedMethods) {
      res[method] = (data: any) => {
        this._verifyTargetRegistration(method, handle);

        return this.targetedActions[method][handle].args;
      }
    }
    // @ts-ignore
    return res;
  }

  _getSuccessMethods(handle) : MockedLib {
    let res = {};
    for (let method of targetedMethods) {
      res[method] = async (data?: any) => {

        this._resolve(method, handle, data);
        await skipTurn();
      }
    }
    // @ts-ignore
    return res;
  }

  _resolve(method, handle, data?: any) {
    this._verifyTargetRegistration(method, handle);

    this.targetedActions[method][handle].resolve(data);

    delete this.targetedActions[method][handle];
    if (Object.keys(this.targetedActions[method]).length == 0) {
      delete this.targetedActions[method];
    }
  }

  _reject(method, handle, error?: any) {
    this._verifyTargetRegistration(method, handle);

    this.targetedActions[method][handle].reject(error);

    delete this.targetedActions[method][handle];
    if (Object.keys(this.targetedActions[method]).length == 0) {
      delete this.targetedActions[method];
    }
  }

  _verifyTargetRegistration(method, handle) {
    if (!this.targetedActions[method])         { throw "UNREGISTERED_METHOD:"+method }
    if (!this.targetedActions[method][handle]) { throw "UNREGISTERED_HANDLE_FOR:"+method+":"+handle }
  }


  _getErrorMethods(handle) : MockedLib {
    let res = {};
    for (let method of targetedMethods) {
      res[method] = async (error?: any) => {
        this._reject(method, handle, error);
        await skipTurn();
      }
    }
    // @ts-ignore
    return res;
  }
}

async function skipTurn() {
  return new Promise<void>((resolve, reject) => {
    setImmediate(() => { resolve() })
  })
}

interface Resolver {
  succeed: MockedLib,
  fail: MockedLibError,
  getArgsFor: MockedLibArgs
}

interface MockedLibArgs {
  connect                       : () => any[],
  cancelConnectionRequest       : () => any[],
  disconnectCommand             : () => any[],
  phoneDisconnect               : () => any[],
  getMACAddress                 : () => any[],
  setupCrownstone               : () => any[],
  recover                       : () => any[],
  commandFactoryReset           : () => any[],
  multiSwitch                   : () => any[],
  getFirmwareVersion            : () => any[],
  getBootloaderVersion          : () => any[],
  setupFactoryReset             : () => any[],
  putInDFU                      : () => any[],
  performDFU                    : () => any[],
  getHardwareVersion            : () => any[],
  setupPutInDFU                 : () => any[],
  toggleSwitchState             : () => any[],
  bootloaderToNormalMode        : () => any[],
  clearErrors                   : () => any[],
  restartCrownstone             : () => any[],
  setTime                       : () => any[],
  meshSetTime                   : () => any[],
  getTime                       : () => any[],
  setSwitchState                : () => any[],
  getSwitchState                : () => any[],
  lockSwitch                    : () => any[],
  allowDimming                  : () => any[],
  setSwitchCraft                : () => any[],
  sendNoOp                      : () => any[],
  sendMeshNoOp                  : () => any[],
  setMeshChannel                : () => any[],
  setupPulse                    : () => any[],
  addBehaviour                  : () => any[],
  updateBehaviour               : () => any[],
  removeBehaviour               : () => any[],
  getBehaviour                  : () => any[],
  setTapToToggle                : () => any[],
  setTapToToggleThresholdOffset : () => any[],
  getTapToToggleThresholdOffset : () => any[],
  setSoftOnSpeed                : () => any[],
  getSoftOnSpeed                : () => any[],
  syncBehaviours                : () => any[],
  getResetCounter               : () => any[],
  switchRelay                   : () => any[],
  switchDimmer                  : () => any[],
  getSwitchcraftThreshold       : () => any[],
  setSwitchcraftThreshold       : () => any[],
  getMaxChipTemp                : () => any[],
  setMaxChipTemp                : () => any[],
  getDimmerCurrentThreshold     : () => any[],
  setDimmerCurrentThreshold     : () => any[],
  getDimmerTempUpThreshold      : () => any[],
  setDimmerTempUpThreshold      : () => any[],
  getDimmerTempDownThreshold    : () => any[],
  setDimmerTempDownThreshold    : () => any[],
  getVoltageZero                : () => any[],
  setVoltageZero                : () => any[],
  getCurrentZero                : () => any[],
  setCurrentZero                : () => any[],
  getPowerZero                  : () => any[],
  setPowerZero                  : () => any[],
  getVoltageMultiplier          : () => any[],
  setVoltageMultiplier          : () => any[],
  getCurrentMultiplier          : () => any[],
  setCurrentMultiplier          : () => any[],
  setUartState                  : () => any[],
  getBehaviourDebugInformation  : () => any[],
  turnOnMesh                    : () => any[],
  setSunTimesViaConnection      : () => any[],
  trackedDeviceHeartbeat        : () => any[],
  registerTrackedDevice         : () => any[],
  getCrownstoneUptime           : () => any[],
  getMinSchedulerFreeSpace      : () => any[],
  getLastResetReason            : () => any[],
  getGPREGRET                   : () => any[],
  getAdcChannelSwaps            : () => any[],
  getAdcRestarts                : () => any[],
  getSwitchHistory              : () => any[],
  getPowerSamples               : () => any[],
  setUartKey                    : () => any[],
  transferHubTokenAndCloudId    : () => any[],
  requestCloudId                : () => any[],
  factoryResetHub               : () => any[],
  factoryResetHubOnly           : () => any[],
}


interface MockedLib {
  connect                       : (data?: any) => Promise<void>,
  cancelConnectionRequest       : (data?: any) => Promise<void>,
  disconnectCommand             : (data?: any) => Promise<void>,
  phoneDisconnect               : (data?: any) => Promise<void>,
  getMACAddress                 : (data?: any) => Promise<void>,
  setupCrownstone               : (data?: any) => Promise<void>,
  recover                       : (data?: any) => Promise<void>,
  commandFactoryReset           : (data?: any) => Promise<void>,
  multiSwitch                   : (data?: any) => Promise<void>,
  getFirmwareVersion            : (data?: any) => Promise<void>,
  getBootloaderVersion          : (data?: any) => Promise<void>,
  setupFactoryReset             : (data?: any) => Promise<void>,
  putInDFU                      : (data?: any) => Promise<void>,
  performDFU                    : (data?: any) => Promise<void>,
  getHardwareVersion            : (data?: any) => Promise<void>,
  setupPutInDFU                 : (data?: any) => Promise<void>,
  toggleSwitchState             : (data?: any) => Promise<void>,
  bootloaderToNormalMode        : (data?: any) => Promise<void>,
  clearErrors                   : (data?: any) => Promise<void>,
  restartCrownstone             : (data?: any) => Promise<void>,
  setTime                       : (data?: any) => Promise<void>,
  meshSetTime                   : (data?: any) => Promise<void>,
  getTime                       : (data?: any) => Promise<void>,
  setSwitchState                : (data?: any) => Promise<void>,
  getSwitchState                : (data?: any) => Promise<void>,
  lockSwitch                    : (data?: any) => Promise<void>,
  allowDimming                  : (data?: any) => Promise<void>,
  setSwitchCraft                : (data?: any) => Promise<void>,
  sendNoOp                      : (data?: any) => Promise<void>,
  sendMeshNoOp                  : (data?: any) => Promise<void>,
  setMeshChannel                : (data?: any) => Promise<void>,
  setupPulse                    : (data?: any) => Promise<void>,
  addBehaviour                  : (data?: any) => Promise<void>,
  updateBehaviour               : (data?: any) => Promise<void>,
  removeBehaviour               : (data?: any) => Promise<void>,
  getBehaviour                  : (data?: any) => Promise<void>,
  setTapToToggle                : (data?: any) => Promise<void>,
  setTapToToggleThresholdOffset : (data?: any) => Promise<void>,
  getTapToToggleThresholdOffset : (data?: any) => Promise<void>,
  setSoftOnSpeed                : (data?: any) => Promise<void>,
  getSoftOnSpeed                : (data?: any) => Promise<void>,
  syncBehaviours                : (data?: any) => Promise<void>,
  getResetCounter               : (data?: any) => Promise<void>,
  switchRelay                   : (data?: any) => Promise<void>,
  switchDimmer                  : (data?: any) => Promise<void>,
  getSwitchcraftThreshold       : (data?: any) => Promise<void>,
  setSwitchcraftThreshold       : (data?: any) => Promise<void>,
  getMaxChipTemp                : (data?: any) => Promise<void>,
  setMaxChipTemp                : (data?: any) => Promise<void>,
  getDimmerCurrentThreshold     : (data?: any) => Promise<void>,
  setDimmerCurrentThreshold     : (data?: any) => Promise<void>,
  getDimmerTempUpThreshold      : (data?: any) => Promise<void>,
  setDimmerTempUpThreshold      : (data?: any) => Promise<void>,
  getDimmerTempDownThreshold    : (data?: any) => Promise<void>,
  setDimmerTempDownThreshold    : (data?: any) => Promise<void>,
  getVoltageZero                : (data?: any) => Promise<void>,
  setVoltageZero                : (data?: any) => Promise<void>,
  getCurrentZero                : (data?: any) => Promise<void>,
  setCurrentZero                : (data?: any) => Promise<void>,
  getPowerZero                  : (data?: any) => Promise<void>,
  setPowerZero                  : (data?: any) => Promise<void>,
  getVoltageMultiplier          : (data?: any) => Promise<void>,
  setVoltageMultiplier          : (data?: any) => Promise<void>,
  getCurrentMultiplier          : (data?: any) => Promise<void>,
  setCurrentMultiplier          : (data?: any) => Promise<void>,
  setUartState                  : (data?: any) => Promise<void>,
  getBehaviourDebugInformation  : (data?: any) => Promise<void>,
  turnOnMesh                    : (data?: any) => Promise<void>,
  setSunTimesViaConnection      : (data?: any) => Promise<void>,
  trackedDeviceHeartbeat        : (data?: any) => Promise<void>,
  registerTrackedDevice         : (data?: any) => Promise<void>,
  getCrownstoneUptime           : (data?: any) => Promise<void>,
  getMinSchedulerFreeSpace      : (data?: any) => Promise<void>,
  getLastResetReason            : (data?: any) => Promise<void>,
  getGPREGRET                   : (data?: any) => Promise<void>,
  getAdcChannelSwaps            : (data?: any) => Promise<void>,
  getAdcRestarts                : (data?: any) => Promise<void>,
  getSwitchHistory              : (data?: any) => Promise<void>,
  getPowerSamples               : (data?: any) => Promise<void>,
  setUartKey                    : (data?: any) => Promise<void>,
  transferHubTokenAndCloudId    : (data?: any) => Promise<void>,
  requestCloudId                : (data?: any) => Promise<void>,
  factoryResetHub               : (data?: any) => Promise<void>,
  factoryResetHubOnly           : (data?: any) => Promise<void>,
}


interface MockedLibError {
  connect                       : (err?: any) => Promise<void>,
  cancelConnectionRequest       : (err?: any) => Promise<void>,
  disconnectCommand             : (err?: any) => Promise<void>,
  phoneDisconnect               : (err?: any) => Promise<void>,
  getMACAddress                 : (err?: any) => Promise<void>,
  setupCrownstone               : (err?: any) => Promise<void>,
  recover                       : (err?: any) => Promise<void>,
  commandFactoryReset           : (err?: any) => Promise<void>,
  multiSwitch                   : (err?: any) => Promise<void>,
  getFirmwareVersion            : (err?: any) => Promise<void>,
  getBootloaderVersion          : (err?: any) => Promise<void>,
  setupFactoryReset             : (err?: any) => Promise<void>,
  putInDFU                      : (err?: any) => Promise<void>,
  performDFU                    : (err?: any) => Promise<void>,
  getHardwareVersion            : (err?: any) => Promise<void>,
  setupPutInDFU                 : (err?: any) => Promise<void>,
  toggleSwitchState             : (err?: any) => Promise<void>,
  bootloaderToNormalMode        : (err?: any) => Promise<void>,
  clearErrors                   : (err?: any) => Promise<void>,
  restartCrownstone             : (err?: any) => Promise<void>,
  setTime                       : (err?: any) => Promise<void>,
  meshSetTime                   : (err?: any) => Promise<void>,
  getTime                       : (err?: any) => Promise<void>,
  setSwitchState                : (err?: any) => Promise<void>,
  getSwitchState                : (err?: any) => Promise<void>,
  lockSwitch                    : (err?: any) => Promise<void>,
  allowDimming                  : (err?: any) => Promise<void>,
  setSwitchCraft                : (err?: any) => Promise<void>,
  sendNoOp                      : (err?: any) => Promise<void>,
  sendMeshNoOp                  : (err?: any) => Promise<void>,
  setMeshChannel                : (err?: any) => Promise<void>,
  setupPulse                    : (err?: any) => Promise<void>,
  addBehaviour                  : (err?: any) => Promise<void>,
  updateBehaviour               : (err?: any) => Promise<void>,
  removeBehaviour               : (err?: any) => Promise<void>,
  getBehaviour                  : (err?: any) => Promise<void>,
  setTapToToggle                : (err?: any) => Promise<void>,
  setTapToToggleThresholdOffset : (err?: any) => Promise<void>,
  getTapToToggleThresholdOffset : (err?: any) => Promise<void>,
  setSoftOnSpeed                : (err?: any) => Promise<void>,
  getSoftOnSpeed                : (err?: any) => Promise<void>,
  syncBehaviours                : (err?: any) => Promise<void>,
  getResetCounter               : (err?: any) => Promise<void>,
  switchRelay                   : (err?: any) => Promise<void>,
  switchDimmer                  : (err?: any) => Promise<void>,
  getSwitchcraftThreshold       : (err?: any) => Promise<void>,
  setSwitchcraftThreshold       : (err?: any) => Promise<void>,
  getMaxChipTemp                : (err?: any) => Promise<void>,
  setMaxChipTemp                : (err?: any) => Promise<void>,
  getDimmerCurrentThreshold     : (err?: any) => Promise<void>,
  setDimmerCurrentThreshold     : (err?: any) => Promise<void>,
  getDimmerTempUpThreshold      : (err?: any) => Promise<void>,
  setDimmerTempUpThreshold      : (err?: any) => Promise<void>,
  getDimmerTempDownThreshold    : (err?: any) => Promise<void>,
  setDimmerTempDownThreshold    : (err?: any) => Promise<void>,
  getVoltageZero                : (err?: any) => Promise<void>,
  setVoltageZero                : (err?: any) => Promise<void>,
  getCurrentZero                : (err?: any) => Promise<void>,
  setCurrentZero                : (err?: any) => Promise<void>,
  getPowerZero                  : (err?: any) => Promise<void>,
  setPowerZero                  : (err?: any) => Promise<void>,
  getVoltageMultiplier          : (err?: any) => Promise<void>,
  setVoltageMultiplier          : (err?: any) => Promise<void>,
  getCurrentMultiplier          : (err?: any) => Promise<void>,
  setCurrentMultiplier          : (err?: any) => Promise<void>,
  setUartState                  : (err?: any) => Promise<void>,
  getBehaviourDebugInformation  : (err?: any) => Promise<void>,
  turnOnMesh                    : (err?: any) => Promise<void>,
  setSunTimesViaConnection      : (err?: any) => Promise<void>,
  trackedDeviceHeartbeat        : (err?: any) => Promise<void>,
  registerTrackedDevice         : (err?: any) => Promise<void>,
  getCrownstoneUptime           : (err?: any) => Promise<void>,
  getMinSchedulerFreeSpace      : (err?: any) => Promise<void>,
  getLastResetReason            : (err?: any) => Promise<void>,
  getGPREGRET                   : (err?: any) => Promise<void>,
  getAdcChannelSwaps            : (err?: any) => Promise<void>,
  getAdcRestarts                : (err?: any) => Promise<void>,
  getSwitchHistory              : (err?: any) => Promise<void>,
  getPowerSamples               : (err?: any) => Promise<void>,
  setUartKey                    : (err?: any) => Promise<void>,
  transferHubTokenAndCloudId    : (err?: any) => Promise<void>,
  requestCloudId                : (err?: any) => Promise<void>,
  factoryResetHub               : (err?: any) => Promise<void>,
  factoryResetHubOnly           : (err?: any) => Promise<void>,
}


interface MockedCallList {
  connect                       : () => boolean,
  cancelConnectionRequest       : () => boolean,
  disconnectCommand             : () => boolean,
  phoneDisconnect               : () => boolean,
  getMACAddress                 : () => boolean,
  setupCrownstone               : () => boolean,
  recover                       : () => boolean,
  commandFactoryReset           : () => boolean,
  multiSwitch                   : () => boolean,
  getFirmwareVersion            : () => boolean,
  getBootloaderVersion          : () => boolean,
  setupFactoryReset             : () => boolean,
  putInDFU                      : () => boolean,
  performDFU                    : () => boolean,
  getHardwareVersion            : () => boolean,
  setupPutInDFU                 : () => boolean,
  toggleSwitchState             : () => boolean,
  bootloaderToNormalMode        : () => boolean,
  clearErrors                   : () => boolean,
  restartCrownstone             : () => boolean,
  setTime                       : () => boolean,
  meshSetTime                   : () => boolean,
  getTime                       : () => boolean,
  setSwitchState                : () => boolean,
  getSwitchState                : () => boolean,
  lockSwitch                    : () => boolean,
  allowDimming                  : () => boolean,
  setSwitchCraft                : () => boolean,
  sendNoOp                      : () => boolean,
  sendMeshNoOp                  : () => boolean,
  setMeshChannel                : () => boolean,
  setupPulse                    : () => boolean,
  addBehaviour                  : () => boolean,
  updateBehaviour               : () => boolean,
  removeBehaviour               : () => boolean,
  getBehaviour                  : () => boolean,
  setTapToToggle                : () => boolean,
  setTapToToggleThresholdOffset : () => boolean,
  getTapToToggleThresholdOffset : () => boolean,
  setSoftOnSpeed                : () => boolean,
  getSoftOnSpeed                : () => boolean,
  syncBehaviours                : () => boolean,
  getResetCounter               : () => boolean,
  switchRelay                   : () => boolean,
  switchDimmer                  : () => boolean,
  getSwitchcraftThreshold       : () => boolean,
  setSwitchcraftThreshold       : () => boolean,
  getMaxChipTemp                : () => boolean,
  setMaxChipTemp                : () => boolean,
  getDimmerCurrentThreshold     : () => boolean,
  setDimmerCurrentThreshold     : () => boolean,
  getDimmerTempUpThreshold      : () => boolean,
  setDimmerTempUpThreshold      : () => boolean,
  getDimmerTempDownThreshold    : () => boolean,
  setDimmerTempDownThreshold    : () => boolean,
  getVoltageZero                : () => boolean,
  setVoltageZero                : () => boolean,
  getCurrentZero                : () => boolean,
  setCurrentZero                : () => boolean,
  getPowerZero                  : () => boolean,
  setPowerZero                  : () => boolean,
  getVoltageMultiplier          : () => boolean,
  setVoltageMultiplier          : () => boolean,
  getCurrentMultiplier          : () => boolean,
  setCurrentMultiplier          : () => boolean,
  setUartState                  : () => boolean,
  getBehaviourDebugInformation  : () => boolean,
  turnOnMesh                    : () => boolean,
  setSunTimesViaConnection      : () => boolean,
  trackedDeviceHeartbeat        : () => boolean,
  registerTrackedDevice         : () => boolean,
  getCrownstoneUptime           : () => boolean,
  getMinSchedulerFreeSpace      : () => boolean,
  getLastResetReason            : () => boolean,
  getGPREGRET                   : () => boolean,
  getAdcChannelSwaps            : () => boolean,
  getAdcRestarts                : () => boolean,
  getSwitchHistory              : () => boolean,
  getPowerSamples               : () => boolean,
  setUartKey                    : () => boolean,
  transferHubTokenAndCloudId    : () => boolean,
  requestCloudId                : () => boolean,
  factoryResetHub               : () => boolean,
  factoryResetHubOnly           : () => boolean,
}

let targetedMethods = [
  "connect",
  "cancelConnectionRequest",
  "disconnectCommand",
  "phoneDisconnect",
  "getMACAddress",
  "setupCrownstone",
  "recover",
  "commandFactoryReset",
  "multiSwitch",
  "getFirmwareVersion",
  "getBootloaderVersion",
  "setupFactoryReset",
  "putInDFU",
  "performDFU",
  "getHardwareVersion",
  "setupPutInDFU",
  "toggleSwitchState",
  "bootloaderToNormalMode",
  "clearErrors",
  "restartCrownstone",
  "setTime",
  "meshSetTime",
  "getTime",
  "setSwitchState",
  "getSwitchState",
  "lockSwitch",
  "allowDimming",
  "setSwitchCraft",
  "sendNoOp",
  "sendMeshNoOp",
  "setMeshChannel",
  "setupPulse",
  "addBehaviour",
  "updateBehaviour",
  "removeBehaviour",
  "getBehaviour",
  "setTapToToggle",
  "setTapToToggleThresholdOffset",
  "getTapToToggleThresholdOffset",
  "setSoftOnSpeed",
  "getSoftOnSpeed",
  "syncBehaviours",
  "getResetCounter",
  "switchRelay",
  "switchDimmer",
  "getSwitchcraftThreshold",
  "setSwitchcraftThreshold",
  "getMaxChipTemp",
  "setMaxChipTemp",
  "getDimmerCurrentThreshold",
  "setDimmerCurrentThreshold",
  "getDimmerTempUpThreshold",
  "setDimmerTempUpThreshold",
  "getDimmerTempDownThreshold",
  "setDimmerTempDownThreshold",
  "getVoltageZero",
  "setVoltageZero",
  "getCurrentZero",
  "setCurrentZero",
  "getPowerZero",
  "setPowerZero",
  "getVoltageMultiplier",
  "setVoltageMultiplier",
  "getCurrentMultiplier",
  "setCurrentMultiplier",
  "setUartState",
  "getBehaviourDebugInformation",
  "turnOnMesh",
  "setSunTimesViaConnection",
  "trackedDeviceHeartbeat",
  "registerTrackedDevice",
  "getCrownstoneUptime",
  "getMinSchedulerFreeSpace",
  "getLastResetReason",
  "getGPREGRET",
  "getAdcChannelSwaps",
  "getAdcRestarts",
  "getSwitchHistory",
  "getPowerSamples",
  "setUartKey",
  "transferHubTokenAndCloudId",
  "requestCloudId",
  "factoryResetHub",
  "factoryResetHubOnly",
];

const otherMethods = [
  "clearTrackedBeacons",
  "isReady",
  "isPeripheralReady",
  "finalizeFingerprint",
  "setKeySets",
  "requestLocation",
  "broadcastUpdateTrackedDevice",
  "setTimeViaBroadcast",
  "broadcastSwitch",
  "turnOnBroadcast",
  "broadcastBehaviourSettings",
  "getBehaviourMasterHash",
  "getTrackingState",
  "clearFingerprintsPromise",
  "isDevelopmentEnvironment",
  "canUseDynamicBackgroundBroadcasts",
  "checkBroadcastAuthorization"
]