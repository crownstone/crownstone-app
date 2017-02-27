import { Alert } from 'react-native';

import { BlePromiseManager } from '../logic/BlePromiseManager'
import { BluenetPromises, NativeBus } from './Proxy';
import { LOG } from '../logging/Log'
import { stoneTypes } from '../router/store/reducers/stones'
import { eventBus } from '../util/eventBus'
import { Util } from '../util/Util'
import { CLOUD } from '../cloud/cloudAPI'
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../ExternalConfig'


const networkError = 'network_error';

export class SetupHelper {
  advertisement : any;
  handle : any;
  name : any;
  type : any;
  icon : any;
  macAddress     : any;
  cloudResponse  : any;
  stoneIdInCloud : any;
  
  constructor(setupAdvertisement, name, type, icon) {
    // full advertisement package
    this.advertisement = setupAdvertisement;

    // shorthand to the handle
    this.handle = setupAdvertisement.handle;

    this.name = name;
    this.type = type;
    this.icon = icon;

    // things to be filled out during setup process
    this.macAddress = undefined;
    this.cloudResponse = undefined;
    this.stoneIdInCloud = undefined; // shorthand to the cloud id
  }

  claim(store, sphereId) {
    // things to be filled out during setup process
    this.macAddress = undefined;
    this.cloudResponse = undefined;
    this.stoneIdInCloud = undefined; // shorthand to the cloud id

    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    eventBus.emit("ignoreTriggers");
    eventBus.emit("setupStarted", this.handle);
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("setupInProgress", { handle: this.handle, progress: 1 });
        BluenetPromises.connect(this.handle)
          .then(() => {
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 2 });
            return BluenetPromises.getMACAddress();
          })
          .then((macAddress) => {
            this.macAddress = macAddress;
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 2 });
            return BluenetPromises.phoneDisconnect();
          })
          .then(() => {
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 3 });
            return this.registerInCloud(sphereId);
          })
          .then((cloudResponse) => {
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 4 });
            this.cloudResponse = cloudResponse;
            this.stoneIdInCloud = cloudResponse.id;
            return this.setupCrownstone(store, sphereId);
          })
          .then(() => {
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 18 });
            setTimeout(() => { eventBus.emit("setupInProgress", { handle: this.handle, progress: 19 }); }, 300);
            setTimeout(() => {
              let actions = [];
              let isPlug = this.type === stoneTypes.plug;
              let isGuidestone = this.type === stoneTypes.guidestone;
              let state = store.getState();
              let showRestoreAlert = false;
              let addStoneAction = {
                type:           "ADD_STONE",
                sphereId:       sphereId,
                stoneId:        this.stoneIdInCloud,
                data: {
                  type:           this.type,
                  touchToToggle:  isPlug,
                  crownstoneId:   this.cloudResponse.uid,
                  handle:         this.handle,
                  macAddress:     this.macAddress,
                  iBeaconMajor:   this.cloudResponse.major,
                  iBeaconMinor:   this.cloudResponse.minor,
                  disabled:       false,
                  rssi:           -60
                }
              };

              if (state.spheres[sphereId].stones[this.stoneIdInCloud] !== undefined) {
                showRestoreAlert = true;
              }
              else {
                // if we do not know the stone, we provide the new name and icon
                addStoneAction.data["name"] = this.name;
                addStoneAction.data["icon"] = this.icon;
              }

              actions.push(addStoneAction);
              actions.push({
                type: 'UPDATE_STONE_SWITCH_STATE',
                sphereId: sphereId,
                stoneId: this.stoneIdInCloud,
                data: { state: isGuidestone ? 0 : 1, currentUsage: 0 },
              });

              store.batchDispatch(actions);

              if (showRestoreAlert) {
                Alert.alert(
                  "I know this one!",
                  "This Crownstone was already your sphere. I've combined the existing Crownstone " +
                  "data with the one you just set up!",
                  [{text: "OK"}]);
              }

              // Restore trigger state
              eventBus.emit("useTriggers");
              eventBus.emit("setupComplete", this.handle);

              // Resolve the setup promise.
              resolve();

              // start the tap-to-toggle tutorial
              if (this.type === stoneTypes.plug) { // find the ID
                if (Util.data.getTapToToggleCalibration(state)) {
                  eventBus.emit("CalibrateTapToToggle");
                }
              }

              // show the celebration of 4 stones
              state = store.getState();
              if (Object.keys(state.spheres[sphereId].stones).length === AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION) {
                eventBus.emit('showLocalizationSetupStep1', sphereId);
              }
            }, 2500);
          })
          .catch((err) => {
            // Restore trigger state
            eventBus.emit("useTriggers");
            eventBus.emit("setupCancelled", this.handle);
            if (this.stoneIdInCloud !== undefined) {
              CLOUD.forSphere(sphereId).deleteStone(this.stoneIdInCloud).catch((err) => {LOG.error("COULD NOT CLEAN UP AFTER SETUP", err)})
            }

            if (err == "INVALID_SESSION_DATA") {
              Alert.alert("Encryption might be off","Error: INVALID_SESSION_DATA, which usually means encryption in this Crownstone is turned off. This app requires encryption to be on.",[{text:'OK'}]);
            }
            else if (err === networkError) {
              // do nothing, alert was already sent
            }
            else {
              // user facing alert
              Alert.alert("I'm Sorry!", "Something went wrong during the setup. Please try it again and stay really close to it!", [{text:"OK"}]);
            }

            LOG.error("error during setup phase:", err);

            BluenetPromises.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
          })
      });
    };

    // we load the setup into the promise manager with priority so we are not interrupted
    return BlePromiseManager.registerPriority(setupPromise, {from: 'Setup: claiming stone: ' + this.handle});
  }

  registerInCloud(sphereId) {
    return new Promise((resolve, reject) => {
      const processFailure = (err?) => {
        if (err.message && err.message === 'Network request failed') {
          reject(networkError);
        }
        else {
          Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{text:"OK", onPress:() => {
            reject(networkError);
          }}]);
        }
      };

      CLOUD.forSphere(sphereId).createStone(sphereId, this.macAddress, this.type)
        .then(resolve)
        .catch((err) => {
          if (err.status === 422) {
            CLOUD.forSphere(sphereId).findStone(this.macAddress)
              .then((foundCrownstones) => {
                if (foundCrownstones.length === 1) {
                  resolve(foundCrownstones[0]);
                }
                else {
                  processFailure();
                }
              })
              .catch((err) => {
                LOG.error("CONNECTION ERROR on find:",err);
                processFailure(err);
              })
          }
          else {
            LOG.error("CONNECTION ERROR on register:",err);
            processFailure(err);
          }
        });
    })
  }

  setupCrownstone(store, sphereId) {
    const state = store.getState();
    let sphereData = state.spheres[sphereId].config;

    let data = {};
    data["crownstoneId"]      = this.cloudResponse.uid;
    data["adminKey"]          = sphereData.adminKey;
    data["memberKey"]         = sphereData.memberKey;
    data["guestKey"]          = sphereData.guestKey;
    data["meshAccessAddress"] = sphereData.meshAccessAddress;
    data["ibeaconUUID"]       = sphereData.iBeaconUUID;
    data["ibeaconMajor"]      = this.cloudResponse.major;
    data["ibeaconMinor"]      = this.cloudResponse.minor;

    let unsubscribe = NativeBus.on(NativeBus.topics.setupProgress, (progress) => {
      eventBus.emit("setupInProgress", { handle: this.handle, progress: 4 + progress });
    });

    return new Promise((resolve, reject) => {
      BluenetPromises.connect(this.handle)
        .then(() => {
          return BluenetPromises.setupCrownstone(data);
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