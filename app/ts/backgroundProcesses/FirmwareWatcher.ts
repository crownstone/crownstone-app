import {LOG, LOGe} from "../logging/Log";
import {core} from "../Core";
import {from} from "../logic/constellation/Tellers";
import {StoneProximityTrigger} from "../native/advertisements/StoneProximityTrigger";
import {Get} from "../util/GetUtil";
import {DataUtil} from "../util/DataUtil";
import {xUtil} from "../util/StandAloneUtil";


const FWWatcherClassId = "FirmwareWatcher"

class FirmwareWatcherClass {
  _initialized: boolean = false;

  init() {
    LOG.info('LOADED STORE FirmwareWatcher', this._initialized);
    if (this._initialized === false) {
      // once the user is logged in, we will check if there are crownstones that we do not know the firmware of.

      core.eventBus.on('enterSphere', (sphereId) => { this.screenCrownstonesInSphere(sphereId); });
    }
    this._initialized = true;
  }

  screenCrownstonesInSphere(sphereId) {
    LOG.info("FirmwareWatcher: Starting Crownstone data check");

    let state = core.store.getState();
    if (!state.spheres[sphereId]) {
      LOGe.info("FirmwareWatcher: Can not find this Sphere in the state.", sphereId);
      return;
    }

    let loadedCommands = false;
    let randomCheck = Math.random() < 0.025;
    if (randomCheck) {
      LOG.info("FirmwareWatcher: Random Firmware Check Forced.");
    }

    DataUtil.callOnStonesInSphere(sphereId, (stoneId, stone) => {
      let execute = !stone.config.firmwareVersion         ||
                     stone.config.firmwareVersion === '0' ||
                    randomCheck                           ||
                    !stone.config.hardwareVersion         ||
                     stone.config.hardwareVersion === '0' ||
        (!stone.config.uicr && xUtil.versions.canIUse(stone.config.firmwareVersion,'5.0.0'));

      LOG.info("FirmwareWatcher: Looping over stones:", stoneId, " has: firmware:", stone.config.firmwareVersion, 'hardware:', stone.config.hardwareVersion, 'uicr:', stone.config.uicr, "Will execute when in range:", execute);

      if (execute) {
        StoneProximityTrigger.setTrigger(sphereId, stoneId, FWWatcherClassId, () => {
          this.getCrownstoneDetails(sphereId, stoneId);
        }, -80);
        loadedCommands = true;
      }
    });

    if (loadedCommands) {
      LOG.info("FirmwareWatcher: Firmware commands loaded into BatchCommandHandler. These will fire when the required Crownstone is in range.");
    }
    else {
      LOG.info("FirmwareWatcher: No need to run a firmware/hardware version check.");
    }
  }

  getCrownstoneDetails(sphereId, stoneId) {
    let stone = Get.stone(sphereId, stoneId);
    if (!stone) { return; }

    LOG.info("FirmwareWatcher: Getting Crownstone details.", stone.config.name);
    from(stone, 30).getFirmwareVersion()
      .then((firmwareVersion : string) => {
        core.store.dispatch({
          type:     "UPDATE_STONE_CONFIG",
          stoneId:  stoneId,
          sphereId: sphereId,
          data: {
            firmwareVersion: firmwareVersion
          }
        });
      })
      .catch((err) => { LOGe.info("FirmwareWatcher: Failed to get firmware version from stone.", err?.message)});

    from(stone, 30).getHardwareVersion()
      .then((hardwareVersion : string) => {
        core.store.dispatch({
          type: "UPDATE_STONE_CONFIG",
          stoneId: stoneId,
          sphereId: sphereId,
          data: {
            hardwareVersion: hardwareVersion
          }
        });
      })
      .catch((err) => { LOGe.info("FirmwareWatcher: Failed to get hardware version from stone.", err?.message) });

    from(stone, 30).getBootloaderVersion()
      .then((bootloaderVersion : string) => {
        if (bootloaderVersion) {
          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: stoneId,
            sphereId: sphereId,
            data: {
              bootloaderVersion: bootloaderVersion
            }
          });
        }
      })
      .catch((err) => { LOGe.info("FirmwareWatcher: Failed to get bootloader version from stone.", err?.message) });


    if (xUtil.versions.canIUse(stone.config.firmwareVersion,'5.0.0')) {
      from(stone, 30).getUICR()
        .then((UICR: UICRData) => {
          core.store.dispatch({
            type: "UPDATE_STONE_CONFIG",
            stoneId: stoneId,
            sphereId: sphereId,
            data: {
              uicr: UICR
            }
          });
        })
        .catch((err) => { LOGe.info("FirmwareWatcher: Failed to get uicr version from stone.", err?.message); });
    }
  }

}

export const FirmwareWatcher = new FirmwareWatcherClass();