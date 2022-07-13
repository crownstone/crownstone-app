
export function mockBluenetPromiseWrapper() {
  let libStateWrapper = new LibContainer()

  let mocks = {};
  for (let method of bluenetPromise_targetedMethods) {
    mocks[method] = function() {
      let args = arguments;
      let handle = args[0].toLowerCase();
      // console.log("Providing promise",method, handle, arguments)
      return new Promise((resolve, reject) => {
        libStateWrapper.loadTargeted(method, handle, resolve, reject, args)
      })
    }
  }
  for (let method of bluenetPromise_genericMethods) {
    mocks[method] = function() {
      let args = arguments;
      // console.log("Providing generic promise", method, arguments)
      return new Promise((resolve, reject) => {
        libStateWrapper.loadGeneric(method, resolve, reject, args)
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
  genericActions  : {[commandName: string]: {resolve: (data?: any) => void, reject: (err: any) => void, args: any[]}[]} = {}

  reset() {
    for (let [commandName, handleObj] of Object.entries(this.targetedActions)) {
      for (let [handle, promise] of Object.entries(handleObj)) {
        promise.reject("CLEAR")
      }
    }
    this.targetedActions = {};

    for (let [commandName, handleObj] of Object.entries(this.genericActions)) {
      for (let [handle, promise] of Object.entries(handleObj)) {
        promise.reject("CLEAR")
      }
    }
    this.genericActions = {};
  }

  loadGeneric(commandName, resolve: (data?: any) => void, reject: (err: any) => void, args: any) {
    // console.log("Generic Promise received", commandName, args)
    if (this.genericActions[commandName] === undefined) {
      this.genericActions[commandName] = []
    }
    this.genericActions[commandName].push({resolve, reject, args})
  }

  loadTargeted(commandName, handle, resolve: (data?: any) => void, reject: (err: any) => void, args: any) {
    if (this.targetedActions[commandName] === undefined) {
      this.targetedActions[commandName] = {};
    }

    // console.log("Targeted Promise received", commandName, handle, args)
    if (this.targetedActions[commandName][handle] === undefined) {
      this.targetedActions[commandName][handle] = {resolve, reject, args}
    }
    else {
      throw "ALREADY_IN_TARGETED_ACTIONS"
    }
  }

  succeed(): MockedGenericLib {
    return this._getSuccessMethodsGeneric()
  }

  fail(): MockedGenericLibError {
    return this._getErrorMethodsGeneric()
  }

  for(handle: string) : Resolver {
    handle = handle.toLowerCase();
    return {
      succeed:    this._getSuccessMethods(handle),
      fail:       this._getErrorMethods(handle),
      getArgsFor: this._getArgGetters(handle),
    }
  }

  async cancelConnectionRequest(handle) : Promise<void> {
    handle = handle.toLowerCase();
     this._reject('connect', handle, 'CONNECTION_CANCELLED');
     this._resolve('cancelConnectionRequest', handle)
  }

  has(handle?: string) : {called: MockedCallList, stacked: MockedCountList} {
    if (handle) { handle = handle.toLowerCase(); }
    return {
      called: this._getCallMethods(handle),
      stacked: this._getStackCount()
    }
  }

  _getCallMethods(handle) : MockedCallList {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = (data: any) => {
        try {
          this._verifyTargetRegistration(method, handle);
        }
        catch (e) { return false; }
        return true;
      }
    }

    for (let method of bluenetPromise_genericMethods) {
      res[method] = (data: any) => {
        try {
          this._verifyGenericRegistration(method);
        }
        catch (e) { return false; }
        return true;
      }
    }

    // @ts-ignore
    return res
  }

  _getStackCount() : MockedCountList {
    let res = {};
    for (let method of bluenetPromise_genericMethods) {
      res[method] = (data: any) => {
        try {
          this._verifyGenericRegistration(method);
        }
        catch (e) { return 0; }

        return this.genericActions[method].length
      }
    }

    // @ts-ignore
    return res
  }

  _getArgGetters(handle) : MockedLibArgs {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = (data: any) => {
        this._verifyTargetRegistration(method, handle);

        return this.targetedActions[method][handle].args;
      }
    }
    // @ts-ignore
    return res;
  }
  _getArgGettersGeneric() : MockedLibArgs {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = (data: any) => {
        this._verifyGenericRegistration(method);
        return this.genericActions[method][0].args;
      }
    }
    // @ts-ignore
    return res;
  }
  _getSuccessMethodsGeneric() : MockedGenericLib {
    let res = {};
    for (let method of bluenetPromise_genericMethods) {
      res[method] = async (data?: any) => {
        this._resolveGeneric(method, data);
        await skipTurn();
      }
    }
    // @ts-ignore
    return res;
  }

  _getSuccessMethods(handle) : MockedLib {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = async (data?: any) => {
        this._resolve(method, handle, data);
        await skipTurn();
      }
    }
    // @ts-ignore
    return res;
  }

  _resolveGeneric(method, data?: any) {
    this._verifyGenericRegistration(method);
    this.genericActions[method][0].resolve(data);
    this.genericActions[method].shift();
  }
  _rejectGeneric(method, err: any = "GenericError") {
    this._verifyGenericRegistration(method);
    this.genericActions[method][0].reject(err);
    this.genericActions[method].shift();
  }
  _resolve(method, handle, data?: any) {
    this._verifyTargetRegistration(method, handle);

    this.targetedActions[method][handle].resolve(data);

    delete this.targetedActions[method][handle];
    if (Object.keys(this.targetedActions[method]).length == 0) {
      delete this.targetedActions[method];
    }
  }

  _reject(method, handle, error= "GenericError") {
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
  _verifyGenericRegistration(method) {
    if (!this.genericActions[method])             { throw "UNREGISTERED_METHOD:"+method }
    if (this.genericActions[method].length == 0 ) { throw "UNREGISTERED_METHOD:"+method }
  }


  _getErrorMethodsGeneric() : MockedGenericLibError {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = async (error?: any) => {
        this._rejectGeneric(method, error);
        await skipTurn();
      }
    }
    // @ts-ignore
    return res;
  }

  _getErrorMethods(handle) : MockedLibError {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
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


export const bluenetPromise_targetedMethods = [
  "connect",
  "cancelConnectionRequest",
  "disconnectCommand",
  "phoneDisconnect",
  "getMACAddress",
  "setupCrownstone",
  "recover",
  "commandFactoryReset",
  "multiSwitch",
  "getUICR",
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

export const bluenetPromise_genericMethods = [
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