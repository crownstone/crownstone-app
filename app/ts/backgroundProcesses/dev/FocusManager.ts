import { Platform } from "react-native";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { core } from "../../Core";
import { xUtil } from "../../util/StandAloneUtil";

class FocusManagerClass {

  crownstoneMode = 'unverified';
  scanning = false;
  crownstoneState = {
    stoneId: null,
    error: null,
    errorDetails: null,
    temperature: null,
    powerUsage: null,
    dimmingEnabled: null,
    dimmerReady: null,
    locked: null,
    switchCraft: null,
    switchStateValue: null,
    switchState: null,
    relayState: null,
    dimmerState: null,
    dimmerCurrentThreshold: null,
    resetCounter: null,
    rssiAverage: null,
    referenceId: null,
    firmwareVersion: null,
    hardwareVersion: null,
    bootloaderVersion: null,
    switchCraftThreshold: null,
    maxChipTemp: null,
    dimmerTempUpThreshold: null,
    dimmerTempDownThreshold: null,
    voltageZero: null,
    currentZero: null,
    powerZero: null,
    macAddress: null,
    voltageMultiplier: null,
    currentMultiplier: null,
  }

  updateFreeze = {
    error: false,
    errorDetails: false,
    dimmingEnabled: false,
    dimmerReady: false,
    locked: false,
    switchCraft: false,
    switchState: false,
    relayState: false,
    dimmerState: false,
  }

  updateFreezeTimeouts = {
    error: null,
    errorDetails: null,
    dimmingEnabled: null,
    dimmerReady: null,
    locked: null,
    switchCraft: null,
    switchState: null,
    relayState: null,
    dimmerState: null,
  }
  unsubscribe = [];

  handle = null;
  name = null;

  constructor() {}

  setHandleToFocusOn(handle, mode, name) {
    this.name = name;
    this.handle = handle;
    this.stopScanning();
    this.startScanning();

    this.crownstoneMode = mode || 'unverified';

    for (let field in this.crownstoneState)      { this.crownstoneState[field]      = null;  }
    for (let field in this.updateFreeze)         { this.updateFreeze[field]         = false; }
    for (let field in this.updateFreezeTimeouts) { this.updateFreezeTimeouts[field] = null;  }
  }

  startScanning() {
    if (this.scanning === false) {
      this.scanning = true;
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.advertisement, (data: crownstoneAdvertisement) => {
        if (data.handle === this.handle) {
          this.update(data, 'verified');
        }
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.unverifiedAdvertisementData, (data: crownstoneAdvertisement) => {
        if (data.handle === this.handle) {
          this.update(data, 'unverified');
        }
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.setupAdvertisement, (data: crownstoneAdvertisement) => {
        if (data.handle === this.handle) {
          this.update(data, 'setup');
        }
      }))
      this.unsubscribe.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (data : crownstoneAdvertisement) => {
        if (data.handle === this.handle) {
          this.update(data, 'dfu');
        }
      }))
    }
  }

  stopScanning() {
    this.scanning = false;
    this.unsubscribe.forEach((unsub) => { unsub(); });
    this.unsubscribe = [];
  }


  update(data: crownstoneAdvertisement, type) {
    let updateRequired = false;

    let updateRssi = false;
    if (this.crownstoneState.rssiAverage === null) {
      if (data.rssi < 0) {
        this.crownstoneState.rssiAverage = data.rssi;
        updateRssi = true;
      }
    }

    let rssi = this.crownstoneState.rssiAverage;

    if (data.rssi < 0) {
      this.crownstoneState.rssiAverage = Math.round(0.3 * data.rssi + 0.7 * this.crownstoneState.rssiAverage);
    }


    if (rssi !== this.crownstoneState.rssiAverage) {
      updateRssi = true;
    }

    if (updateRssi) {
      core.eventBus.emit("FOCUS_RSSI_UPDATE")
    }

    if (type === 'verified' && data.serviceData.setupMode === true) {
      return;
    }

    if (type !== this.crownstoneMode) {
      this.crownstoneMode = type;
      updateRequired = true;
    }


    if (type === "unverified" || type === "dfu") {
      if (updateRequired) {
        core.eventBus.emit("FOCUS_UPDATE");
      }
      return;
    }

    // check if this is a mesh message or a direct one
    if (data.serviceData.stateOfExternalCrownstone === true) {
      if (updateRequired) {
        core.eventBus.emit("FOCUS_UPDATE");
      }
      return;
    }


    let updateCheck = (field, source) => {
      if (this.updateFreeze[field] !== true) {
        if (this.crownstoneState[field] !== source) {
          updateRequired = true;
          this.crownstoneState[field] = source;
        }
      }
    }

    if (Platform.OS === 'android') {
      updateCheck('macAddress', data.handle);
    }

    // these are available in both the errorData as well as the normal service Data
    updateCheck('powerUsage', data.serviceData.powerUsageReal);
    updateCheck('temperature', data.serviceData.temperature);

    if (this.crownstoneState.powerUsage !== data.serviceData.powerUsageReal) { updateRequired = true; this.crownstoneState.powerUsage  = data.serviceData.powerUsageReal; }
    if (this.crownstoneState.temperature !== data.serviceData.temperature)   { updateRequired = true; this.crownstoneState.temperature = data.serviceData.temperature;    }

    if (data.serviceData.errorMode) {
      updateCheck('error', data.serviceData.hasError);
      if (this.crownstoneState.errorDetails === null || !xUtil.deepCompare(this.crownstoneState.errorDetails,data.serviceData.errors)) {
        updateRequired = true;
        this.crownstoneState.errorDetails = data.serviceData.errors;
      }
    }

    this.name = data.name;

    if (data.serviceData.errorMode === true) { return; }

    updateCheck('error', data.serviceData.hasError);
    updateCheck('dimmingEnabled', data.serviceData.dimmingAllowed);
    updateCheck('dimmerReady', data.serviceData.dimmerReady);
    updateCheck('locked', data.serviceData.switchLocked);
    updateCheck('switchCraft', data.serviceData.switchCraftEnabled);
    updateCheck('referenceId', data.referenceId);
    updateCheck('stoneId', data.serviceData.crownstoneId);

    if (this.crownstoneState.error === false && this.crownstoneState.errorDetails !== null) {
      this.crownstoneState.errorDetails = null;
    }

    if (this.crownstoneState.switchState !== data.serviceData.switchState) {
      updateCheck('switchState', data.serviceData.switchState);
      updateCheck('relayState', data.serviceData.switchState >= 128 ? 1 : 0);
      updateCheck('dimmerState', data.serviceData.switchState >= 128 ? 0.01* (data.serviceData.switchState - 128) : 0.01*data.serviceData.switchState);
      if (this.updateFreeze.switchState === false) {
        updateRequired = true;
        this.crownstoneState.switchStateValue = this.crownstoneState.relayState === 1 ? 1 : this.crownstoneState.dimmerState;
      }
    }

    if (updateRequired) {
      core.eventBus.emit("FOCUS_UPDATE");
    }
  }


  setUpdateFreeze(type) {
    if (this.updateFreezeTimeouts[type] === undefined) { return }
    clearTimeout(this.updateFreezeTimeouts[type]);
    this.updateFreeze[type] = true;
  }

  setFreezeTimeout(type) {
    if (this.updateFreezeTimeouts[type] === undefined) { return }
    clearTimeout(this.updateFreezeTimeouts[type]);
    this.updateFreezeTimeouts[type] = setTimeout(() => {
      this.clearUpdateFreeze(type);
    }, 1000);
  }

  clearUpdateFreeze(type) {
    if (this.updateFreezeTimeouts[type] === undefined) { return }
    clearTimeout(this.updateFreezeTimeouts[type]);
    this.updateFreeze[type] = false;
  }
}

export const FocusManager = new FocusManagerClass();