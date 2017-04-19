import { BatchCommandHandler } from '../logic/BatchCommandHandler'
import { LOG }                 from "../logging/Log";
import { eventBus }            from "../util/EventBus";
import { Util } from "../util/Util";

class FirmwareWatcherClass {
  _initialized: boolean = false;
  store: any;

  constructor() { }

  loadStore(store: any) {
    LOG.info('LOADED STORE FirmwareWatcher', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // once the user is logged in, we will check if there are crownstones that we do not know the firmware of.
      eventBus.on('enterSphere', (sphereId) => { this.checkFirmware(sphereId); });
    }
    this._initialized = true;
  }

  checkFirmware(sphereId) {
    LOG.info("FirmwareWatcher: Starting Firmware Check");

    let state = this.store.getState();
    let loadedCommands = false;
    let randomCheck = Math.random() < 0.05;
    if (randomCheck) {
      LOG.info("FirmwareWatcher: Random Firmware Check Forced.");
    }

    Util.data.callOnStonesInSphere(state, sphereId, (stoneId, stone) => {
      LOG.info("FirmwareWatcher: Looping over stones:", stoneId, " has: ", stone.config.firmwareVersion);
      // random chance to check the firmware again.
      if (!stone.config.firmwareVersion || stone.config.firmwareVersion === '0' || randomCheck) {
        BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'getFirmwareVersion'}, 1e5)
          .then((firmwareVersion) => {
            this.store.dispatch({
              type: "UPDATE_STONE_CONFIG",
              stoneId: stoneId,
              sphereId: sphereId,
              data: {
                firmwareVersion: firmwareVersion
              }
            });
          })
          .catch((err) => { LOG.error("FirmwareWatcher: Failed to get firmware from stone.", err)});
        loadedCommands = true;
      }
    });

    if (loadedCommands) {
      LOG.info("FirmwareWatcher: Firmware commands loaded into BatchCommandHandler. Executing!");
      BatchCommandHandler.execute();
    }
  }
}

export const FirmwareWatcher = new FirmwareWatcherClass();