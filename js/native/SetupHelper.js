import { Alert } from 'react-native';

import { BleActions, NativeBus, Bluenet } from './Proxy';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { stoneTypes } from '../router/store/reducers/stones'
import { eventBus } from '../util/eventBus'
import { CLOUD } from '../cloud/cloudAPI'

export class SetupHelper {
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
    eventBus.emit("setupInProgress", { handle: this.handle, progress: 1 });
    return BleActions.connect(this.handle)
      .then(() => {
        eventBus.emit("setupInProgress", { handle: this.handle, progress: 2 });
        return BleActions.getMACAddress();
      })
      .then((macAddress) => {
        eventBus.emit("setupInProgress", { handle: this.handle, progress: 3 });
        this.macAddress = macAddress;
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
          let isGuidestone = this.type === stoneTypes.guidestone;
          actions.push({
            type:           "ADD_STONE",
            sphereId:       sphereId,
            stoneId:        this.stoneIdInCloud,
            data: {
              name:           this.name,
              type:           this.type,
              icon:           this.icon,
              touchToToggle:  !isGuidestone,
              crownstoneId:   this.cloudResponse.uid,
              handle:         this.handle,
              macAddress:     this.macAddress,
              iBeaconMajor:   this.cloudResponse.major,
              iBeaconMinor:   this.cloudResponse.minor,
            }
          });
          actions.push({
            type: 'UPDATE_STONE_STATE',
            sphereId: sphereId,
            stoneId: this.stoneIdInCloud,
            data: { state: isGuidestone ? 0 : 1, currentUsage: 0 },
          });

          store.batchDispatch(actions);

          // Restore trigger state
          eventBus.emit("useTriggers");
          eventBus.emit("setupComplete", this.handle);
          let state = store.getState();
          if (Object.keys(state.spheres[sphereId].stones).length === 4) {
            eventBus.emit('showLocalizationSetupStep1', sphereId);
          }
        }, 2500);
      })
      .catch((err) => {
        // Restore trigger state
        eventBus.emit("useTriggers");
        eventBus.emit("setupCancelled", this.handle);
        if (err == "INVALID_SESSION_DATA") {
          Alert.alert("Encryption might be off","Error: INVALID_SESSION_DATA, which usually means encryption in this Crownstone is turned off. This app requires encryption to be on.",[{text:'OK'}]);
        }
        else {
          // user facing alert
          Alert.alert("I'm Sorry!", "Something went wrong during the setup. Please try it again and stay really close to it!", [{text:"OK"}]);
        }
        if (this.stoneIdInCloud !== undefined) {
          CLOUD.forSphere(sphereId).deleteStone(this.stoneIdInCloud).catch((err) => {LOGError("COULD NOT CLEAN UP AFTER SETUP", err)})
        }
        LOGError("error during setup phase:", err);
        return BleActions.phoneDisconnect();
      })
  }

  registerInCloud(sphereId) {
    return new Promise((resolve, reject) => {
      const processFailure = () => {
        Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{text:"OK", onPress:() => {
          reject();
        }}]);
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
                LOGError("CONNECTION ERROR on find:",err);
                processFailure();
              })
          }
          else {
            LOGError("CONNECTION ERROR on register:",err);
            processFailure();
          }
        });
    })
  }

  setupCrownstone(store, sphereId) {
    const state = store.getState();
    let sphereData = state.spheres[sphereId].config;

    let data = {};
    data.crownstoneId      = this.cloudResponse.uid;
    data.adminKey          = sphereData.adminKey;
    data.memberKey         = sphereData.memberKey;
    data.guestKey          = sphereData.guestKey;
    data.meshAccessAddress = sphereData.meshAccessAddress;
    data.ibeaconUUID       = sphereData.iBeaconUUID;
    data.ibeaconMajor      = this.cloudResponse.major;
    data.ibeaconMinor      = this.cloudResponse.minor;

    let unsubscribe = NativeBus.on(NativeBus.topics.setupProgress, (progress) => {
      eventBus.emit("setupInProgress", { handle: this.handle, progress: 4 + progress });
    });

    return new Promise((resolve, reject) => {
      BleActions.connect(this.handle)
        .then(() => {
          return BleActions.setupCrownstone(data);
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