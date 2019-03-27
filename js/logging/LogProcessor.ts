import { LOG_LEVEL }  from "./LogLevels";
import { core } from "../core";


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

    core.eventBus.on("databaseChange", (data) => {
      if (data.change.changeUserDeveloperStatus || data.change.changeDeveloperData) {
        this.refreshData();
      }
    });
    this.refreshData();
  }

  refreshData() {
    if (this.store) {
      let state = this.store.getState();
      let dev = state.user.developer;
      let loggingEnabled = state.development.logging_enabled;
      let devState = state.development;

      this.writeToFile = dev === true && loggingEnabled === true;

      this.log_info           = loggingEnabled && devState.log_info           || LOG_LEVEL.NONE;
      this.log_mesh           = loggingEnabled && devState.log_mesh           || LOG_LEVEL.NONE;
      this.log_native         = loggingEnabled && devState.log_native         || LOG_LEVEL.NONE;
      this.log_notifications  = loggingEnabled && devState.log_notifications  || LOG_LEVEL.NONE;
      this.log_scheduler      = loggingEnabled && devState.log_scheduler      || LOG_LEVEL.NONE;
      this.log_ble            = loggingEnabled && devState.log_ble            || LOG_LEVEL.NONE;
      this.log_bch            = loggingEnabled && devState.log_bch            || LOG_LEVEL.NONE;
      this.log_advertisements = loggingEnabled && devState.log_advertisements || LOG_LEVEL.NONE;
      this.log_events         = loggingEnabled && devState.log_events         || LOG_LEVEL.NONE;
      this.log_store          = loggingEnabled && devState.log_store          || LOG_LEVEL.NONE;
      this.log_cloud          = loggingEnabled && devState.log_cloud          || LOG_LEVEL.NONE;
    }
  }
}

export const LogProcessor : any = new LogProcessorClass();
