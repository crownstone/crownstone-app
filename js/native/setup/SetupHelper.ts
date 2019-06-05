import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper } from '../libInterface/BluenetPromise';
import {LOG, LOGe} from '../../logging/Log'
import { CLOUD }                 from '../../cloud/cloudAPI'
import {Scheduler} from "../../logic/Scheduler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {ScheduleUtil} from "../../util/ScheduleUtil";
import {StoneUtil} from "../../util/StoneUtil";
import { KEY_TYPES, STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { xUtil } from "../../util/StandAloneUtil";
import { UpdateCenter } from "../../backgroundProcesses/UpdateCenter";


const networkError = 'network_error';

export class SetupHelper {
  handle : any;
  name : any;
  type : any;
  icon : any;

  // things to be filled out during setup process
  macAddress      : any;
  firmwareVersion : any;
  hardwareVersion : any;
  cloudResponse   : any;
  meshDeviceKey   : any;
  stoneIdInCloud  : any;
  stoneWasAlreadyInCloud : boolean = false;

  constructor(handle, name, type, icon) {
    // shorthand to the handle
    this.handle = handle;
    this.name = name;
    this.type = type;
    this.icon = icon;
  }


  /**
   * This claims a stone, this means it will perform setup, register in cloud and clean up after itself.
   * @param sphereId
   * @param silent            // if silent is true, this means no popups will be sent or triggered.
   * @returns {Promise<T>}
   */
  claim(sphereId, silent : boolean = false) : Promise<string> {
    // things to be filled out during setup process
    this.macAddress = undefined;
    this.cloudResponse = undefined;
    this.firmwareVersion = undefined; // ie. 1.1.1
    this.hardwareVersion = undefined; // ie. 1.1.1
    this.stoneIdInCloud = undefined; // shorthand to the cloud id
    this.meshDeviceKey = undefined; // shorthand to the cloud id
    this.stoneWasAlreadyInCloud = false; // is the stone is already in the cloud during setup of this stone.

    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    core.eventBus.emit("ignoreTriggers");
    core.eventBus.emit("setupStarted", this.handle);
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 1 });
        BluenetPromiseWrapper.connect(this.handle, sphereId)
          .then(() => {
            LOG.info("setup progress: connected");
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 2 });
            return BluenetPromiseWrapper.getMACAddress();
          })
          .then((macAddress) => {
            this.macAddress = macAddress;
            LOG.info("setup progress: have mac address: ", macAddress);
            return BluenetPromiseWrapper.getFirmwareVersion();
          })
          .then((firmwareVersion) => {
            this.firmwareVersion = firmwareVersion;
            this.firmwareVersion = "1.1.0";
            LOG.info("setup progress: have firmware version: ", firmwareVersion);
            return BluenetPromiseWrapper.getHardwareVersion();
          })
          .then((hardwareVersion) => {
            this.hardwareVersion = hardwareVersion;
            LOG.info("setup progress: have hardware version: ", hardwareVersion);
          })
          .then(() => {
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 3 });
            return this.registerInCloud(sphereId);
          })
          .then((cloudResponse : any) => {
            LOG.info("setup progress: registered in cloud");
            return this.getMeshDeviceKeyFromCloud(sphereId, cloudResponse.id);
          })
          .then((meshDeviceKey) => {
            LOG.info("setup progress: DeviceKeyReceveived in cloud");
            return this.setupCrownstone(sphereId, meshDeviceKey);
          })
          .then(() => {
            LOG.info("setup progress: setupCrownstone done");
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 18 });

            // fast setup will require much less time in 'stand-by' after the setup has completed.
            let fastSetupEnabled = xUtil.versions.isHigherOrEqual(this.firmwareVersion, '2.1.0');

            // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
            Scheduler.scheduleCallback(() => { core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 19 }); }, 20, 'setup19');
            Scheduler.scheduleCallback(() => {
              let actions = [];

              // if we know this crownstone, its localId is in the mapProvider which we can look for with the cloudId
              let localId = MapProvider.cloud2localMap.stones[this.stoneIdInCloud] || this.stoneIdInCloud;
              let isPlug = this.type === STONE_TYPES.plug;
              let canSwitch = this.type === STONE_TYPES.plug || this.type === STONE_TYPES.builtin;
              let familiarCrownstone = false;
              let finalizeSetupStoneAction = {
                type:           "ADD_STONE",
                sphereId:       sphereId,
                stoneId:        localId,
                data: {
                  cloudId:         this.stoneIdInCloud,
                  type:            this.type,
                  tapToToggle:     isPlug,
                  crownstoneId:    this.cloudResponse.uid,
                  firmwareVersion: this.firmwareVersion,
                  hardwareVersion: this.hardwareVersion,
                  handle:          this.handle,
                  macAddress:      this.macAddress,
                  iBeaconMajor:    this.cloudResponse.major,
                  iBeaconMinor:    this.cloudResponse.minor,
                  disabled:        false,
                  rssi:            -60
                }
              };

              if (MapProvider.cloud2localMap.stones[this.stoneIdInCloud]) {
                familiarCrownstone = true;
                finalizeSetupStoneAction.type = "UPDATE_STONE_CONFIG";
                this._restoreSchedules(sphereId, MapProvider.cloud2localMap.stones[localId]);
              }
              else {
                // if we do not know the stone, we provide the new name and icon
                finalizeSetupStoneAction.data["name"] = this.name + ' ' + this.cloudResponse.uid;
                finalizeSetupStoneAction.data["icon"] = this.icon;
              }

              actions.push(finalizeSetupStoneAction);
              actions.push({
                type: 'UPDATE_STONE_SWITCH_STATE',
                sphereId: sphereId,
                stoneId: localId,
                data: { state: canSwitch ? 1 : 0, currentUsage: 0 },
              });

              core.store.batchDispatch(actions);

              // Restore trigger state
              core.eventBus.emit("useTriggers");

              // first add to database, then emit. The adding to database will cause a redraw and having this event after it can lead to race conditions / ghost stones / missing room nodes.
              core.eventBus.emit("setupComplete", this.handle);

              LOG.info("setup complete");

              // Resolve the setup promise.
              resolve({id:localId, familiarCrownstone: familiarCrownstone});

              UpdateCenter.checkForFirmwareUpdates();

            }, fastSetupEnabled ? 50 : 2500, 'setup20 resolver timeout');
          })
          .catch((err) => {
            // Restore trigger state
            core.eventBus.emit("useTriggers");
            core.eventBus.emit("setupCancelled", this.handle);

            // clean up in the cloud after failed setup.
            if (this.stoneIdInCloud !== undefined && this.stoneWasAlreadyInCloud === false) {
              CLOUD.forSphere(sphereId).deleteStone(this.stoneIdInCloud).catch((err) => {LOGe.info("COULD NOT CLEAN UP AFTER SETUP", err)})
            }

            if (err == "INVALID_SESSION_DATA" && silent === false) {
              Alert.alert("Encryption might be off","Error: INVALID_SESSION_DATA, which usually means encryption in this Crownstone is turned off. This app requires encryption to be on.",[{text:'OK'}]);
            }
            else if (err === networkError) {
              // do nothing, alert was already sent
            }
            // else if (silent === false) {
            //   // user facing alert
            //   Alert.alert("I'm Sorry!", "Something went wrong during the setup. Please try it again and stay really close to it!", [{text:"OK"}]);
            // }

            LOGe.info("SetupHelper: Error during setup phase:", err);

            BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
          })
      });
    };

    // we load the setup into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: claiming stone: ' + this.handle});
  }

  getMeshDeviceKeyFromCloud(sphereId, stoneId) {
    return CLOUD.getKeys(sphereId, stoneId, false)
      .then((keyData) => {
        if (keyData.length !== 1) { throw {code: networkError, message: "Invalid key data count"}; }

        let cloudStoneId = MapProvider.local2cloudMap.stones[stoneId]   || stoneId;
        if (keyData[0] && keyData[0].stoneKeys && keyData[0].stoneKeys[cloudStoneId]) {
          let stoneKeys = keyData[0].stoneKeys[cloudStoneId];
          for ( let i = 0; i < stoneKeys.length; i++) {
            let stoneKey = stoneKeys[i];
            if (stoneKey.keyType === KEY_TYPES.MESH_DEVICE_KEY && stoneKey.ttl === 0) {
              return stoneKey.key;
            }
          }
        }

        throw {code: networkError, message: "Invalid key data"};
      })
  }


  registerInCloud(sphereId) {
    return new Promise((resolve, reject) => {
      const processFailure = (err?) => {
        if (err.message && err.message === 'Network request failed') {
          reject({code: networkError, message: err.message});
        }
        else {
          reject({code: networkError, message: err});
          // let defaultAction = () => { reject(networkError); };
          // Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{ text:"OK", onPress: defaultAction }], { onDismiss: defaultAction });
        }
      };

      CLOUD.forSphere(sphereId).createStone({
        sphereId: sphereId,
        address: this.macAddress,
        type: this.type,
        name: this.name,
        icon: this.icon,
        firmwareVersion: this.firmwareVersion,
        hardwareVersion: this.hardwareVersion,
        tapToToggle: this.type == STONE_TYPES.plug
      }, false)
        .then(resolve)
        .catch((err) => {
          if (err.status === 422) {
            CLOUD.forSphere(sphereId).findStone(this.macAddress)
              .then((foundCrownstones) => {
                if (foundCrownstones.length === 1) {
                  this.stoneWasAlreadyInCloud = true;
                  resolve(foundCrownstones[0]);
                }
                else {
                  processFailure();
                }
              })
              .catch((err) => {
                LOGe.info("SetupHelper: CONNECTION ERROR on find:",err);
                processFailure(err);
              })
          }
          else {
            LOGe.info("SetupHelper: CONNECTION ERROR on register:",err);
            processFailure(err);
          }
        });
    })
  }

  setupCrownstone(sphereId, meshDeviceKey) {
    const state = core.store.getState();
    let sphere = state.spheres[sphereId];
    let sphereData = sphere.config;
    let sphereKeys = sphere.keys;

    let keyMap = {};
    for (let i = 0; i < sphereKeys.length; i++) {
      if (sphereKeys[i].ttl === 0) {
        keyMap[sphereKeys[i].keyType] = sphereKeys[i].key;
      }
    }

    let data = {};
    data["crownstoneId"]       = this.cloudResponse.uid;
    data["sphereId"]           = sphereData.uid;
    data["adminKey"]           = keyMap[KEY_TYPES.ADMIN_KEY];
    data["memberKey"]          = keyMap[KEY_TYPES.MEMBER_KEY];
    data["basicKey"]           = keyMap[KEY_TYPES.BASIC_KEY];
    data["serviceDataKey"]     = keyMap[KEY_TYPES.SERVICE_DATA_KEY];
    data["meshNetworkKey"]     = keyMap[KEY_TYPES.MESH_NETWORK_KEY];
    data["meshApplicationKey"] = keyMap[KEY_TYPES.MESH_APPLICATION_KEY];
    data["meshDeviceKey"]      = meshDeviceKey;
    data["meshAccessAddress"]  = sphereData.meshAccessAddress; // legacy
    data["ibeaconUUID"]        = sphereData.iBeaconUUID;
    data["ibeaconMajor"]       = this.cloudResponse.major;
    data["ibeaconMinor"]       = this.cloudResponse.minor;

    let unsubscribe = core.nativeBus.on(core.nativeBus.topics.setupProgress, (progress) => {
      core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 4 + progress });
    });

    return new Promise((resolve, reject) => {
      BluenetPromiseWrapper.connect(this.handle, sphereId)
        .then(() => {
          return BluenetPromiseWrapper.setupCrownstone(data);
        })
        .then(() => {
          unsubscribe();
          resolve();
        })
        .catch((err) => {
          unsubscribe();
          reject(err);
        })
    });
  }

  _restoreSchedules(sphereId, localStoneId) {
    let state  = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!sphere) { return; }

    let stone  = sphere.stones[localStoneId];
    if (!stone) { return; }

    let schedules = stone.schedules;
    if (!schedules) { return; }

    let scheduleIds = Object.keys(schedules);
    let loadedSchedule = false;

    scheduleIds.forEach((scheduleId) => {
      let schedule = schedules[scheduleId];
      if (schedule.active) {
        loadedSchedule = true;
        // copy the schedule so we can change the time from crownstone time to timestamp
        let scheduleCopy = {...schedule};
        scheduleCopy.time = StoneUtil.crownstoneTimeToTimestamp(scheduleCopy.time);
        let scheduleConfig = ScheduleUtil.getBridgeFormat(scheduleCopy);

        BatchCommandHandler.loadPriority(
          stone,
          localStoneId,
          sphereId,
          { commandName : 'setSchedule', scheduleConfig: scheduleConfig },
          {},
          10
        ).catch((err) => { LOGe.info("SetupHelper: could not restore schedules.", err)})
        }
    });

    if (loadedSchedule) {
      BatchCommandHandler.load(stone, localStoneId, sphereId, { commandName: 'setTime', time: StoneUtil.nowToCrownstoneTime()}, {}, 10).catch(() => {});
      BatchCommandHandler.executePriority();
    }
  }
}