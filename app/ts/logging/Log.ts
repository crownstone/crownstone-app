import {
  LOG_INFO,
  LOG_ADVERTISEMENTS,
  LOG_EVENTS,
  LOG_CLOUD,
  LOG_BLE,
  LOG_MESH,
  LOG_CONSTELLATION,
  LOG_BEHAVIOUR,
  LOG_STORE,
  LOG_SCHEDULER,
  RELEASE_MODE_USED, LOG_MESSAGES, LOG_NATIVE,
  LOG_TIME_DIFFS,
  LOG_TIMESTAMPS, LOG_NOTIFICATIONS, LOG_BCH, LOG_TO_FILE, LOG_DFU, LOG_BROADCAST, LOG_PROMISE_MANAGER, LOG_NAVIGATION
} from "../ExternalConfig";
import { LogProcessor } from "./LogProcessor";
import { logToFile } from "./LogUtil";
import { LOG_LEVEL } from "./LogLevels";
import DeviceInfo from 'react-native-device-info';
import { base_core } from "../base_core";

let lastLogTime = 0;

class Logger {
  level : number;
  levelPrefix : string;


  constructor(level) {
    this.level = level;
    switch(this.level) {
      case LOG_LEVEL.verbose:
        this.levelPrefix = 'v'; break;
      case LOG_LEVEL.debug:
        this.levelPrefix = 'd'; break;
      case LOG_LEVEL.info:
        this.levelPrefix = 'i'; break;
      case LOG_LEVEL.warning:
        this.levelPrefix = 'w'; break;
      case LOG_LEVEL.error:
        this.levelPrefix = 'e'; break;
      default:
        this.levelPrefix = 'v';
    }
  }
  
  info(...any) {
    this._log('------------', LOG_INFO,      LogProcessor.log_info, arguments);
  }

  promiseManager(...any) {
    this._log('PROMISE MNGR', LOG_PROMISE_MANAGER, LogProcessor.log_promiseManager, arguments);
  }

  constellation(...any) {
    this._log('CONSTELLATION', LOG_PROMISE_MANAGER, LogProcessor.log_promiseManager, arguments);
  }

  broadcast(...any) {
    this._log('BROADCAST --', LOG_BROADCAST,    LogProcessor.log_broadcast, arguments);
  }

  notifications(...any) {
    this._log('NOTIFCATION ', LOG_NOTIFICATIONS, LogProcessor.log_notifications, arguments);
  }

  event(...any) {
    this._log('EVENT ------', LOG_EVENTS,    LogProcessor.log_events, arguments);
  }

  cloud(...any) {
    this._log('Cloud ------', LOG_CLOUD,     LogProcessor.log_cloud, arguments);
  }

  advertisements(...any) {
    this._log('ADVERTISEMENTS --------', LOG_ADVERTISEMENTS, LogProcessor.log_advertisements, arguments);
  }

  bch(...any) {
    this._log('bch --------', LOG_BCH,       LogProcessor.log_bch, arguments);
  }

  ble(...any) {
    this._log('BLE --------', LOG_BLE,       LogProcessor.log_ble, arguments);
  }

  store(...any) {
    this._log('Store ------', LOG_STORE,     LogProcessor.log_store, arguments);
  }

  dfu(...any) {
    this._log('DFU --------', LOG_DFU,     LogProcessor.log_dfu, arguments);
  }

  behaviour(...any) {
    this._log('Behaviour --', LOG_BEHAVIOUR ,LogProcessor.log_behaviour, arguments);
  }

  scheduler(...any) {
    this._log('Scheduler --', LOG_SCHEDULER, LogProcessor.log_scheduler, arguments);
  }

  mesh(...any) {
    this._log('Mesh -------', LOG_MESH,      LogProcessor.log_mesh, arguments);
  }

  messages(...any) {
    this._log('Messages ---', LOG_MESSAGES,  LogProcessor.log_info, arguments);
  }

  native(...any) {
    this._log('Native -----', LOG_NATIVE,  LogProcessor.log_native, arguments);
  }

  nav(...any) {
    this._log('NAV --------', LOG_NAVIGATION,  LogProcessor.log_nav, arguments);
  }

  _log(type, globalCheckField, dbCheckField, allArguments) {
    if (Math.min(globalCheckField, dbCheckField) <= this.level) {
      let prefix = '';
      let now = Date.now();
      if (LOG_TIMESTAMPS) {
        prefix += now + ' - '
      }
      if (LOG_TIME_DIFFS) {
        prefix = "dt:" + (now - lastLogTime) + ' - ' + prefix
      }
      lastLogTime = now;

      let args = [prefix + 'LOG' + this.levelPrefix + ' ' + type + ' :'];
      for (let i = 0; i < allArguments.length; i++) {
        let arg = allArguments[i];
        args.push(arg);
      }

      if (LOG_TO_FILE || LogProcessor.writeToFile === true) {
        // @ts-ignore
        logToFile.apply(this, args);
      }

      if (RELEASE_MODE_USED === false || base_core.sessionMemory.developmentEnvironment) {
        if (this.level > LOG_LEVEL.info) {
          // @ts-ignore
          console.log.apply(this, args);
        }
        else {
          // @ts-ignore
          console.log.apply(this, args);
        }
      }
    }
  }
}


export const LOGv = new Logger(LOG_LEVEL.verbose);
export const LOGd = new Logger(LOG_LEVEL.debug  );
export const LOGi = new Logger(LOG_LEVEL.info   );
export const LOG  = new Logger(LOG_LEVEL.info   );
export const LOGw = new Logger(LOG_LEVEL.warning);
export const LOGe = new Logger(LOG_LEVEL.error  );


LOG.info("Device Manufacturer",    DeviceInfo.getManufacturer());  // e.g. Apple
LOG.info("Device Brand",           DeviceInfo.getBrand());  // e.g. Apple / htc / Xiaomi
LOG.info("Device Model",           DeviceInfo.getModel());  // e.g. iPhone 6
LOG.info("Device ID",              DeviceInfo.getDeviceId());  // e.g. iPhone7,2 / or the board on Android e.g. goldfish
LOG.info("System Name",            DeviceInfo.getSystemName());  // e.g. iPhone OS
LOG.info("System Version",         DeviceInfo.getSystemVersion());  // e.g. 9.0
LOG.info("Bundle ID",              DeviceInfo.getBundleId());  // e.g. com.learnium.mobile
LOG.info("Build Number",           DeviceInfo.getBuildNumber());  // e.g. 89
LOG.info("App Version",            DeviceInfo.getVersion());  // e.g. 1.1.0
LOG.info("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
LOG.info("Device Name",            DeviceInfo.getDeviceName());  // e.g. Becca's iPhone 6
// LOG.info("User Agent",             DeviceInfo.getUserAgent()); // e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)