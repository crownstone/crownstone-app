import { Platform } from 'react-native';
import { Scheduler } from '../logic/Scheduler'
import { eventBus } from '../util/EventBus'
import {cleanLogs} from "./LogUtil";
import {LOG} from "./Log";
import {LOG_LEVEL} from "./LogLevels";

const DeviceInfo = require('react-native-device-info');

class LogProcessorClass {
  store : any;
  writeToFile:        boolean;
  log_info:           number = LOG_LEVEL.NONE;
  log_mesh:           number = LOG_LEVEL.NONE;
  log_notifications:  number = LOG_LEVEL.NONE;
  log_native:         number = LOG_LEVEL.NONE;
  log_scheduler:      number = LOG_LEVEL.NONE;
  log_advertisements: number = LOG_LEVEL.NONE;
  log_ble:            number = LOG_LEVEL.NONE;
  log_bch:            number = LOG_LEVEL.NONE;
  log_events:         number = LOG_LEVEL.NONE;
  log_store:          number = LOG_LEVEL.NONE;
  log_cloud:          number = LOG_LEVEL.NONE;

  constructor() {
    this.store = undefined;
    this.writeToFile = false;

  }

  loadStore(store) {
    this.store = store;

    // use periodic events to clean the logs.
    let triggerId = "LOG_CLEANING_TRIGGER";
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds: 5*3600});
    Scheduler.loadCallback(triggerId,() => { cleanLogs() }, true);

    eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus || data.change.changeDeveloperData) {
        this.refreshData();
      }
    });
    this.refreshData();

    LOG.info("Device Manufacturer", DeviceInfo.getManufacturer());  // e.g. Apple
    LOG.info("Device Brand", DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
    LOG.info("Device Model", DeviceInfo.getModel());  // e.g. iPhone 6
    LOG.info("Device ID", DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
    LOG.info("System Name", DeviceInfo.getSystemName());  // e.g. iPhone OS
    LOG.info("System Version", DeviceInfo.getSystemVersion());  // e.g. 9.0
    LOG.info("Bundle ID", DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
    LOG.info("Build Number", DeviceInfo.getBuildNumber());  // e.g. 89
    LOG.info("App Version", DeviceInfo.getVersion());  // e.g. 1.1.0
    LOG.info("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
    LOG.info("Device Name", DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
    LOG.info("User Agent", DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
    LOG.info("Device Locale", DeviceInfo.getDeviceLocale()); // e.g en-US
    LOG.info("Device Country", DeviceInfo.getDeviceCountry()); // e.g US
    LOG.info("App Instance ID", DeviceInfo.getInstanceID()); // ANDROID ONLY - see https://developers.google.com/instance-id/

    // console.log("getAPILevel()", DeviceInfo.getAPILevel());
    // console.log("getApplicationName()", DeviceInfo.getApplicationName());
    // console.log("getBrand()", DeviceInfo.getBrand());
    // console.log("getBuildNumber()", DeviceInfo.getBuildNumber());
    // console.log("getBundleId()", DeviceInfo.getBundleId());
    // console.log("getCarrier()", DeviceInfo.getCarrier());
    // console.log("getDeviceCountry()", DeviceInfo.getDeviceCountry());
    // console.log("getDeviceId()", DeviceInfo.getDeviceId());
    // console.log("getDeviceLocale()", DeviceInfo.getDeviceLocale());
    // console.log("getDeviceName()", DeviceInfo.getDeviceName());
    // console.log("getFirstInstallTime()", DeviceInfo.getFirstInstallTime());
    // console.log("getFontScale()", DeviceInfo.getFontScale());
    // console.log("getFreeDiskStorage()", DeviceInfo.getFreeDiskStorage());
    // console.log("getInstallReferrer()", DeviceInfo.getInstallReferrer());
    // console.log("getInstanceID()", DeviceInfo.getInstanceID());
    // console.log("getLastUpdateTime()", DeviceInfo.getLastUpdateTime());
    // console.log("getManufacturer()", DeviceInfo.getManufacturer());
    // console.log("getMaxMemory()", DeviceInfo.getMaxMemory());
    // console.log("getModel()", DeviceInfo.getModel());
    // console.log("getPhoneNumber()", DeviceInfo.getPhoneNumber());
    // console.log("getReadableVersion()", DeviceInfo.getReadableVersion());
    // console.log("getSerialNumber()", DeviceInfo.getSerialNumber());
    // console.log("getSystemName()", DeviceInfo.getSystemName());
    // console.log("getSystemVersion()", DeviceInfo.getSystemVersion());
    // console.log("getTimezone()", DeviceInfo.getTimezone());
    // console.log("getTotalDiskCapacity()", DeviceInfo.getTotalDiskCapacity());
    // console.log("getTotalMemory()", DeviceInfo.getTotalMemory());
    // console.log("getUniqueID()", DeviceInfo.getUniqueID());
    // console.log("getUserAgent()", DeviceInfo.getUserAgent());
    // console.log("getVersion()", DeviceInfo.getVersion());
    // console.log("is24Hour()", DeviceInfo.is24Hour());
    // console.log("isEmulator()", DeviceInfo.isEmulator());
    // console.log("isPinOrFingerprintSet()", DeviceInfo.isPinOrFingerprintSet());
    // console.log("isTablet()", DeviceInfo.isTablet());
  }

  refreshData() {
    if (this.store) {
      let state = this.store.getState();
      let dev = state.user.developer;
      let loggingEnabled = state.development.logging_enabled;
      let devState = state.development;

      this.writeToFile = dev === true && loggingEnabled === true;

      this.log_info           = loggingEnabled && devState.log_info;
      this.log_mesh           = loggingEnabled && devState.log_mesh;
      this.log_native         = loggingEnabled && devState.log_native;
      this.log_notifications  = loggingEnabled && devState.log_notifications;
      this.log_scheduler      = loggingEnabled && devState.log_scheduler;
      this.log_ble            = loggingEnabled && devState.log_ble;
      this.log_bch            = loggingEnabled && devState.log_bch;
      this.log_advertisements = loggingEnabled && devState.log_advertisements;
      this.log_events         = loggingEnabled && devState.log_events;
      this.log_store          = loggingEnabled && devState.log_store;
      this.log_cloud          = loggingEnabled && devState.log_cloud;
    }
  }
}

export const LogProcessor : any = new LogProcessorClass();
