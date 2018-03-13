import {LogProcessor} from "../../logging/LogProcessor";
import {LOG_BLE} from "../../ExternalConfig";
import {LOG} from "../../logging/Log";
import {eventBus} from "../../util/EventBus";
import {NativeBus} from "../libInterface/NativeBus";


/**
 * Take care of all the logging
 */
class BleLoggerClass {
  listeners = [];
  _initialized = false;

  init() {
    if (this._initialized === false) {
      // subscribe to all events
      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("databaseChange", (data) => {
        let change = data.change;
        if  (change.changeDeveloperData || change.changeUserDeveloperStatus) {
          this._reloadListeners();
        }
      });
      this._initialized = true;
      this._reloadListeners();
    }
  }

  _reloadListeners() {
    // Debug logging of all BLE related events.
    if (LOG_BLE || LogProcessor.log_ble) {
      LOG.ble("Subscribing to all BLE Topics");
      if (this.listeners.length > 0) {
        this.listeners.forEach((unsubscribe) => { unsubscribe(); });
      }
      this.listeners = [];

      this.listeners.push(NativeBus.on(NativeBus.topics.setupAdvertisement, (data) => {
        LOG.ble('setupAdvertisement', data.name, data.rssi, data.handle, data);
      }));
      this.listeners.push(NativeBus.on(NativeBus.topics.advertisement, (data) => {
        LOG.ble('advertisement', data.name, data.rssi, data.handle, data);
      }));
      this.listeners.push(NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => {
        LOG.ble('iBeaconAdvertisement', data[0].rssi, data[0].major, data[0].minor, data);
      }));
      this.listeners.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (data) => {
        LOG.ble('dfuAdvertisement', data);
      }));
    }
  }
}

export const BleLogger = new BleLoggerClass();