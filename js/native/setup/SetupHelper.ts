import { Alert } from 'react-native';

import { BlePromiseManager }     from '../../logic/BlePromiseManager'
import { BluenetPromiseWrapper } from '../libInterface/BluenetPromise';
import { NativeBus }             from '../libInterface/NativeBus';
import { LOG }                   from '../../logging/Log'
import { STONE_TYPES }            from '../../router/store/reducers/stones'
import { eventBus }              from '../../util/EventBus'
import { Util }                  from '../../util/Util'
import { CLOUD }                 from '../../cloud/cloudAPI'
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../../ExternalConfig'
import {SetupStateHandler} from "./SetupStateHandler";
import {Scheduler} from "../../logic/Scheduler";


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
   * @param store
   * @param sphereId
   * @param silent            // if silent is true, this means no popups will be sent or triggered.
   * @returns {Promise<T>}
   */
  claim(store, sphereId, silent : boolean = false) {
    // things to be filled out during setup process
    this.macAddress = undefined;
    this.cloudResponse = undefined;
    this.firmwareVersion = undefined; // ie. 1.1.1
    this.hardwareVersion = undefined; // ie. 1.1.1
    this.stoneIdInCloud = undefined; // shorthand to the cloud id
    this.stoneWasAlreadyInCloud = false; // is the stone is already in the cloud during setup of this stone.

    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    eventBus.emit("ignoreTriggers");
    eventBus.emit("setupStarted", this.handle);
    let setupPromise = () => {
      return new Promise((resolve, reject) => {
        eventBus.emit("setupInProgress", { handle: this.handle, progress: 1 });
        BluenetPromiseWrapper.connect(this.handle)
          .then(() => {
            LOG.info("setup progress: connected");
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 2 });
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
            return BluenetPromiseWrapper.phoneDisconnect();
          })
          .then(() => {
            LOG.info("setup progress: disconnected");
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 3 });
            return this.registerInCloud(sphereId);
          })
          .then((cloudResponse : any) => {
            LOG.info("setup progress: registered in cloud");
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 4 });
            this.cloudResponse = cloudResponse;
            this.stoneIdInCloud = cloudResponse.id;
            return this.setupCrownstone(store, sphereId);
          })
          .then(() => {
            LOG.info("setup progress: setupCrownstone done");
            eventBus.emit("setupInProgress", { handle: this.handle, progress: 18 });

            // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
            Scheduler.scheduleCallback(() => { eventBus.emit("setupInProgress", { handle: this.handle, progress: 19 }); }, 300, 'setup19');
            Scheduler.scheduleCallback(() => {
              let actions = [];
              let isPlug = this.type === STONE_TYPES.plug;
              let isGuidestone = this.type === STONE_TYPES.guidestone;
              let state = store.getState();
              let showRestoreAlert = false;
              let addStoneAction = {
                type:           "ADD_STONE",
                sphereId:       sphereId,
                stoneId:        this.stoneIdInCloud,
                data: {
                  type:            this.type,
                  touchToToggle:   isPlug,
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

              // Restore trigger state
              eventBus.emit("useTriggers");

              // first emit, then add to database. The adding to database will cause a redraw and having this event after it can lead to race conditions / ghost stones / missing room nodes.
              eventBus.emit("setupComplete", this.handle);

              if (state.spheres[sphereId].stones[this.stoneIdInCloud] !== undefined) {
                showRestoreAlert = true;
              }
              else {
                // if we do not know the stone, we provide the new name and icon
                addStoneAction.data["name"] = this.name + ' ' + this.cloudResponse.uid;
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

              if (showRestoreAlert && silent === false) {
                Alert.alert(
                  "I know this one!",
                  "This Crownstone was already your sphere. I've combined the existing Crownstone " +
                  "data with the one you just set up!",
                  [{text: "OK"}]
                );
              }


              LOG.info("setup complete");

              // Resolve the setup promise.
              resolve();

              // show the celebration of 4 stones
              state = store.getState();
              let popupShown = false;
              if (Object.keys(state.spheres[sphereId].stones).length === AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION && silent === false) {
                eventBus.emit('showLocalizationSetupStep1', sphereId);
                popupShown = true;
              }

              // start the tap-to-toggle tutorial, only if there is no other popup shown
              if (this.type === STONE_TYPES.plug && silent === false && popupShown === false) { // find the ID
                if (Util.data.getTapToToggleCalibration(state) === null) {
                  Scheduler.scheduleCallback(() => {
                    if (SetupStateHandler.isSetupInProgress() === false) {
                      eventBus.emit("CalibrateTapToToggle")
                    }
                  }, 1500, 'setup t2t timeout');
                }
              }
            }, 2500, 'setup20 resolver timeout');
          })
          .catch((err) => {
            // Restore trigger state
            eventBus.emit("useTriggers");
            eventBus.emit("setupCancelled", this.handle);

            // clean up in the cloud after failed setup.
            if (this.stoneIdInCloud !== undefined && this.stoneWasAlreadyInCloud === false) {
              CLOUD.forSphere(sphereId).deleteStone(this.stoneIdInCloud).catch((err) => {LOG.error("COULD NOT CLEAN UP AFTER SETUP", err)})
            }

            if (err == "INVALID_SESSION_DATA" && silent === false) {
              Alert.alert("Encryption might be off","Error: INVALID_SESSION_DATA, which usually means encryption in this Crownstone is turned off. This app requires encryption to be on.",[{text:'OK'}]);
            }
            else if (err === networkError) {
              // do nothing, alert was already sent
            }
            else if (silent === false) {
              // user facing alert
              Alert.alert("I'm Sorry!", "Something went wrong during the setup. Please try it again and stay really close to it!", [{text:"OK"}]);
            }

            LOG.error("SetupHelper: Error during setup phase:", err);

            BluenetPromiseWrapper.phoneDisconnect().then(() => { reject(err) }).catch(() => { reject(err) });
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
          let defaultAction = () => { reject(networkError); };
          Alert.alert("Whoops!", "Something went wrong in the Cloud. Please try again later.",[{ text:"OK", onPress: defaultAction }], { onDismiss: defaultAction });
        }
      };

      CLOUD.forSphere(sphereId).createStone(sphereId, this.macAddress, this.type)
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
      BluenetPromiseWrapper.connect(this.handle)
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