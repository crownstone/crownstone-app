import { LOG_LEVEL }  from "./LogLevels";
import { core } from "../core";
import { LOGi } from "./Log";
import DeviceInfo from "react-native-device-info";


class LogProcessorClass {
  initialized =       false;
  writeToFile =       false;

  log_info:           number = LOG_LEVEL.NONE;
  log_promiseManager: number = LOG_LEVEL.NONE;
  log_mesh:           number = LOG_LEVEL.NONE;
  log_notifications:  number = LOG_LEVEL.NONE;
  log_constellation:  number = LOG_LEVEL.NONE;
  log_broadcast:      number = LOG_LEVEL.NONE;
  log_behaviour:      number = LOG_LEVEL.NONE;
  log_native:         number = LOG_LEVEL.NONE;
  log_scheduler:      number = LOG_LEVEL.NONE;
  log_advertisements: number = LOG_LEVEL.NONE;
  log_ble:            number = LOG_LEVEL.NONE;
  log_bch:            number = LOG_LEVEL.NONE;
  log_dfu:            number = LOG_LEVEL.NONE;
  log_events:         number = LOG_LEVEL.NONE;
  log_store:          number = LOG_LEVEL.NONE;
  log_cloud:          number = LOG_LEVEL.NONE;
  log_nav:            number = LOG_LEVEL.NONE;


  init() {
    if (!this.initialized) {
      this.initialized = true;
      core.eventBus.on("databaseChange", (data) => {
        if (data.change.changeUserDeveloperStatus || data.change.changeDeveloperData) {
          this.refreshData();
        }
      });
      this.refreshData();
      LOGi.info("Initializing Logprocessor.")

      LOGi.info("Device Manufacturer",    DeviceInfo.getManufacturer());  // e.g. Apple
      LOGi.info("Device Brand",           DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
      LOGi.info("Device Model",           DeviceInfo.getModel());  // e.g. iPhone 6
      LOGi.info("Device ID",              DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
      LOGi.info("System Name",            DeviceInfo.getSystemName());  // e.g. iPhone OS
      LOGi.info("System Version",         DeviceInfo.getSystemVersion());  // e.g. 9.0
      LOGi.info("Bundle ID",              DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
      LOGi.info("Build Number",           DeviceInfo.getBuildNumber());  // e.g. 89
      LOGi.info("App Version",            DeviceInfo.getVersion());  // e.g. 1.1.0
      LOGi.info("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
      LOGi.info("Device Name",            DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
// LOG.info("User Agent",             DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
    }
  }

  refreshData() {
    if (this.initialized) {
      let state = core.store.getState();
      let dev = state.user.developer;
      let loggingEnabled = state.development.logging_enabled;
      let devState = state.development;

      this.writeToFile = dev === true && loggingEnabled === true;

      this.log_info           = loggingEnabled && devState.log_info           || LOG_LEVEL.NONE;
      this.log_promiseManager = loggingEnabled && devState.log_promiseManager || LOG_LEVEL.NONE;
      this.log_mesh           = loggingEnabled && devState.log_mesh           || LOG_LEVEL.NONE;
      this.log_dfu            = loggingEnabled && devState.log_dfu            || LOG_LEVEL.NONE;
      this.log_native         = loggingEnabled && devState.log_native         || LOG_LEVEL.NONE;
      this.log_constellation  = loggingEnabled && devState.log_constellation  || LOG_LEVEL.NONE;
      this.log_broadcast      = loggingEnabled && devState.log_broadcast      || LOG_LEVEL.NONE;
      this.log_behaviour      = loggingEnabled && devState.log_behaviour      || LOG_LEVEL.NONE;
      this.log_notifications  = loggingEnabled && devState.log_notifications  || LOG_LEVEL.NONE;
      this.log_scheduler      = loggingEnabled && devState.log_scheduler      || LOG_LEVEL.NONE;
      this.log_ble            = loggingEnabled && devState.log_ble            || LOG_LEVEL.NONE;
      this.log_bch            = loggingEnabled && devState.log_bch            || LOG_LEVEL.NONE;
      this.log_advertisements = loggingEnabled && devState.log_advertisements || LOG_LEVEL.NONE;
      this.log_events         = loggingEnabled && devState.log_events         || LOG_LEVEL.NONE;
      this.log_store          = loggingEnabled && devState.log_store          || LOG_LEVEL.NONE;
      this.log_cloud          = loggingEnabled && devState.log_cloud          || LOG_LEVEL.NONE;
      this.log_nav            = loggingEnabled && devState.log_nav            || LOG_LEVEL.NONE;
    }
  }
}

export const LogProcessor : any = new LogProcessorClass();
