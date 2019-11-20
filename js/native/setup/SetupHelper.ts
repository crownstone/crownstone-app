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
import { DataUtil } from "../../util/DataUtil";


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
  storeCrownstone : boolean = true;

  _setupOverrideData : any = null

  constructor(handle, name, type, icon, storeCrownstone = true, setupDataOverride = null) {
    // shorthand to the handle
    this.handle = handle;
    this.name = name;
    this.type = type;
    this.icon = icon;
    this.storeCrownstone = storeCrownstone;

    this._setupOverrideData = setupDataOverride;
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
        core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 1/20 });
        BluenetPromiseWrapper.connect(this.handle, sphereId)
          .then(() => {
            LOG.info("setup progress: connected");
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 2/20 });
            return BluenetPromiseWrapper.getMACAddress();
          })
          .then((macAddress) => {
            this.macAddress = macAddress;
            LOG.info("setup progress: have mac address: ", macAddress);
            return BluenetPromiseWrapper.getFirmwareVersion();
          })
          .then((firmwareVersion) => {
            this.firmwareVersion = firmwareVersion;
            LOG.info("setup progress: have firmware version: ", firmwareVersion);
            return BluenetPromiseWrapper.getHardwareVersion();
          })
          .then((hardwareVersion) => {
            this.hardwareVersion = hardwareVersion;
            LOG.info("setup progress: have hardware version: ", hardwareVersion);
          })
          .then(() => {
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 3/20 });
            return this.registerInCloud(sphereId);
          })
          .then((cloudResponse : any) => {
            LOG.info("setup progress: registered in cloud");
            this.cloudResponse = cloudResponse;
            this.stoneIdInCloud = cloudResponse.id;
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 4/20 });
            return this.getMeshDeviceKeyFromCloud(sphereId, cloudResponse.id);
          })
          .then((meshDeviceKey) => {
            LOG.info("setup progress: DeviceKeyReceveived in cloud");
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 5/20 });
            if (this._setupOverrideData !== null) {
              return this.setupCrownstoneWithOverrideData();
            }
            return this.setupCrownstone(sphereId, meshDeviceKey);
          })
          .then(() => {
            LOG.info("setup progress: setupCrownstone done");
            core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 19/20 });

            // fast setup will require much less time in 'stand-by' after the setup has completed.
            let fastSetupEnabled = xUtil.versions.isHigherOrEqual(this.firmwareVersion, '2.1.0');

            // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
            Scheduler.scheduleCallback(() => { core.eventBus.emit("setupInProgress", { handle: this.handle, progress: 19/20 }); }, 20, 'setup19');
            Scheduler.scheduleCallback(() => {
              let actions = [];

              // if we know this crownstone, its localId is in the mapProvider which we can look for with the cloudId
              let localId = MapProvider.cloud2localMap.stones[this.stoneIdInCloud] || this.stoneIdInCloud;
              let canSwitch = this.type === STONE_TYPES.plug || this.type === STONE_TYPES.builtin || this.type === STONE_TYPES.builtinOne;
              let familiarCrownstone = false;
              let finalizeSetupStoneAction = {
                type:           "ADD_STONE",
                sphereId:       sphereId,
                stoneId:        localId,
                data: {
                  cloudId:         this.stoneIdInCloud,
                  type:            this.type,
                  uid:             this.cloudResponse.uid,
                  crownstoneId:    this.cloudResponse.uid,
                  firmwareVersion: this.firmwareVersion,
                  hardwareVersion: this.hardwareVersion,
                  handle:          this.handle,
                  macAddress:      this.macAddress,
                  iBeaconMajor:    this.cloudResponse.major,
                  iBeaconMinor:    this.cloudResponse.minor,
                }
              };


              if (MapProvider.cloud2localMap.stones[this.stoneIdInCloud]) {
                familiarCrownstone = true;
                finalizeSetupStoneAction.type = "UPDATE_STONE_CONFIG";
                actions.push(finalizeSetupStoneAction);

                let stone = DataUtil.getStone(sphereId, localId);
                if (stone) {
                  let rules = stone.rules;
                  let ruleIds = Object.keys(rules);
                  actions.push({type:"REFRESH_ABILITIES", sphereId: sphereId, stoneId: localId});
                  for (let i = 0; i < ruleIds.length; i++) {
                    actions.push({type:"REFRESH_BEHAVIOURS", sphereId: sphereId, stoneId: localId, ruleId: ruleIds[i]});
                  }
                }
              }
              else {
                // if we do not know the stone, we provide the new name and icon
                finalizeSetupStoneAction.data["name"] = this.name + ' ' + this.cloudResponse.uid;
                finalizeSetupStoneAction.data["icon"] = this.icon;
                actions.push(finalizeSetupStoneAction);
              }


              actions.push({
                type: 'UPDATE_STONE_SWITCH_STATE',
                sphereId: sphereId,
                stoneId: localId,
                data: { state: canSwitch ? 1 : 0, currentUsage: 0 },
              });

              if (this.storeCrownstone === true) {
                core.store.batchDispatch(actions);
              }

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
    if (this.storeCrownstone === false ){
      return Promise.resolve("aStoneKeyForMesh")
    }

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
    if (this.storeCrownstone === false ){
      return Promise.resolve({id:xUtil.getUUID(), uid:Math.floor(Math.random()*255), major: Math.floor(Math.random()*60000), minor: Math.floor(Math.random()*60000)});
    }

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
    let sphereKeyIds = Object.keys(sphere.keys);

    let keyMap = {};
    for (let i = 0; i < sphereKeyIds.length; i++) {
      let key = sphere.keys[sphereKeyIds[i]];
      if (key.ttl === 0) {
        keyMap[key.keyType] = key.key;
      }
    }

    let data = {
      crownstoneId:       this.cloudResponse.uid,
      sphereId:           sphereData.uid,
      adminKey:           keyMap[KEY_TYPES.ADMIN_KEY],
      memberKey:          keyMap[KEY_TYPES.MEMBER_KEY],
      basicKey:           keyMap[KEY_TYPES.BASIC_KEY],
      localizationKey:    keyMap[KEY_TYPES.LOCALIZATION_KEY],
      serviceDataKey:     keyMap[KEY_TYPES.SERVICE_DATA_KEY],
      meshNetworkKey:     keyMap[KEY_TYPES.MESH_NETWORK_KEY],
      meshApplicationKey: keyMap[KEY_TYPES.MESH_APPLICATION_KEY],
      meshDeviceKey:      meshDeviceKey,
      meshAccessAddress:  sphereData.meshAccessAddress,
      ibeaconUUID:        sphereData.iBeaconUUID,
      ibeaconMajor:       this.cloudResponse.major,
      ibeaconMinor:       this.cloudResponse.minor,
    };

    return this._setupCrownstone(data, sphereId);
  }

  setupCrownstoneWithOverrideData() {
    return this._setupCrownstone(this._setupOverrideData, this._setupOverrideData.sphereId)
  }


  _setupCrownstone(setupData, sphereId) {
    let data = {
      crownstoneId:       setupData.crownstoneId,
      sphereId:           setupData.sphereId,
      adminKey:           setupData.adminKey,
      memberKey:          setupData.memberKey,
      basicKey:           setupData.basicKey,
      localizationKey:    setupData.localizationKey,
      serviceDataKey:     setupData.serviceDataKey,
      meshNetworkKey:     setupData.meshNetworkKey,
      meshApplicationKey: setupData.meshApplicationKey,
      meshDeviceKey:      setupData.meshDeviceKey,
      meshAccessAddress:  setupData.meshAccessAddress,
      ibeaconUUID:        setupData.ibeaconUUID,
      ibeaconMajor:       setupData.ibeaconMajor,
      ibeaconMinor:       setupData.ibeaconMinor,
    };

    let unsubscribe = core.nativeBus.on(core.nativeBus.topics.setupProgress, (progress) => {
      core.eventBus.emit("setupInProgress", { handle: this.handle, progress: (5 + progress)/20 });
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
}
