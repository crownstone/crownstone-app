import { LOG_LEVEL }        from "../../logging/LogLevels";
import { LOGd, LOGe, LOGi, LOGw } from "../../logging/Log";
import {  FALLBACKS_ENABLED } from "../../ExternalConfig";
import { Util }             from "../../util/Util";
import { Scheduler }        from "../../logic/Scheduler";
import { LocationHandler }  from "../localization/LocationHandler";
import { StoneMeshTracker } from "./StoneMeshTracker";
import { StoneStoreManager } from "./StoneStoreManager";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import { core } from "../../Core";
import { xUtil } from "../../util/StandAloneUtil";
import { DataUtil } from "../../util/DataUtil";
import { CONDITION_MAP, STONE_TYPES } from "../../Enums";

const UPDATE_CONFIG_FROM_ADVERTISEMENT     = 'UPDATE_CONFIG_FROM_ADVERTISEMENT';
const UPDATE_STATE_FROM_ADVERTISEMENT      = 'UPDATE_STATE_FROM_ADVERTISEMENT';
const UPDATE_STONE_TIME_LAST_SEEN          = 'UPDATE_STONE_TIME_LAST_SEEN';
const UPDATE_STONE_TIME_LAST_SEEN_VIA_MESH = 'UPDATE_STONE_TIME_LAST_SEEN_VIA_MESH';


interface condition {
  type: string,
  expectedValue: any
}

/**
 * This will control a stone. It will make sure advertisements will update its state and keep track of its position in the mesh.
 */
export class StoneEntity {
  subscriptions = [];

  stoneId;
  sphereId;
  store;
  storeManager : StoneStoreManager;
  meshTracker : StoneMeshTracker;

  hubId;

  lastKnownTimestamp = 0;
  lastKnownUniqueElement;
  disabledTimeout;
  clearRssiTimeout;

  ignoreTimeout = null;
  ignoreAdvertisements = false;
  ignoreConditions : condition[] = null;

  debugging = false;
  debugInterval = null;

  constructor(store, storeManager, sphereId, stoneId) {
    LOGi.native("StoneEntity: Creating entity for ", stoneId);
    this.store = store;
    this.storeManager = storeManager;
    this.sphereId = sphereId;
    this.stoneId = stoneId;

    this.meshTracker = new StoneMeshTracker(store, sphereId, stoneId);

    this.subscribe();
    // core.eventBus.on("ADVERTISEMENT_DEBUGGING", (state) => {
    //   this._debug(state);
    // })
  }

  // _debug(state) {
  //   // this can be used to fill the database with fake advertisements
  //   if (state) {
  //     if (this.debugging === false) {
  //       this.debugging = true;
  //       this.debugInterval = setInterval(() => {
  //         let state = this.store.getState();
  //         let stone = state.spheres[this.sphereId].stones[this.stoneId];
  //
  //         let adv = generateFakeAdvertisement(this.sphereId, stone);
  //         this.handleDirectAdvertisement(stone, adv)
  //       }, 50);
  //     }
  //   }
  //   else {
  //     clearInterval(this.debugInterval)
  //   }
  // }


  _validate(state = undefined) {
    if (!state) {
      state = this.store.getState();
    }
    if (!state.spheres[this.sphereId])                      { return false; }
    if (!state.spheres[this.sphereId].stones[this.stoneId]) { return false; }

    return true;
  }


  subscribe() {
    // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
    // This is to avoid the case where a state that was recorded pre-connection is shown post-connection
    // (ie. switch off instead of on)
    this.subscriptions.push(core.eventBus.on("connecting", (handle) => {
      let state = this.store.getState();
      let sphere = state.spheres[this.sphereId];
      let stone = sphere.stones[this.stoneId];

      if (stone.config.handle === handle) {
        this.storeManager.clearActions(this.stoneId);
      }
    }));

    // these timeouts are required for mesh propagation
    this.subscriptions.push(core.eventBus.on(Util.events.getIgnoreTopic(this.stoneId), (data) => {
      if (!data.timeoutMs) { return; }

      // clear any previous timeouts
      this._clearTimeout();

      // use conditions if we have them
      if (data.conditions) {
        this.ignoreConditions = data.conditions;
      }
      else {
        this.ignoreConditions = null;
      }

      // set the ignore flag
      this.ignoreAdvertisements = true;

      // clear any pending advertisementUpdates for this Crownstone.
      this.storeManager.clearActions(this.stoneId);

      // set the timoeut which will cancel the ignore
      this.ignoreTimeout = Scheduler.scheduleCallback(() => {
        this.ignoreTimeout = null;
        this._clearTimeout();
      }, data.timeoutMs, "ignore timeout for Crownstone " + this.stoneId );
    }));
  }


  destroy() {
    this.storeManager.clearActions(this.stoneId);
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.meshTracker.destroy();
  }


  ibeaconUpdate(ibeaconPackage : ibeaconPackage) {
    let state = this.store.getState();
    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOGd.advertisements("AdvertisementHandler: IGNORE: DFU reset is required for this Crownstone.");
      return;
    }

    // If the app has not yet seen this Crownstone, it could be that it does not have a handle.
    // Without handle we do not propagate the update events since we do not know what how to connect to it
    // if we only hear the ibeacon event.
    if (stone.config.handle) {
      this._emitUpdateEvents(stone, ibeaconPackage.rssi);
    }
    else {
      LOGd.advertisements("StoneStateHandler: IGNORE iBeacon message: store has no handle.");
    }

    // fallback to ensure we never miss an enter event caused by a bug in ios 10
    if (FALLBACKS_ENABLED) {
      if (state.spheres[this.sphereId].state.present === false) {
        LOGw.info("FALLBACK: StoneEntity: FORCE ENTER SPHERE BY ADVERTISEMENT UPDATE (or ibeacon)");
        LocationHandler.enterSphere(this.sphereId);
      }
    }
  }


  _emitUpdateEvents(stone, rssi) {
    // These events are used in the Batch Command Handler
    core.eventBus.emit(Util.events.getCrownstoneTopic(this.sphereId, this.stoneId), {
      handle: stone.config.handle,
      stone: stone,
      stoneId: this.stoneId,
      sphereId: this.sphereId,
      rssi: rssi,
    });

    if (stone.config.meshNetworkId) {
      core.eventBus.emit(Util.events.getMeshTopic(this.sphereId, stone.config.meshNetworkId), {
        handle: stone.config.handle,
        stoneId: this.stoneId,
        stone: stone,
        sphereId: this.sphereId,
        meshNetworkId: stone.config.meshNetworkId,
        rssi: rssi,
      });
    }
  }


  _updateExternalRssiIndicator(stoneId, stone, externalId, externalStone, rssi ) {
    if (stone.mesh[externalId] && stone.mesh[externalId].rssi === rssi) {
      // this is the same value as before, ignore
      return;
    }

    // invalid measurement
    if (rssi > 0) { return; }

    const BAD_CONNECTION = -150;

    if (rssi === 0) {
      // One of the Crownstones says there is no connection. We check if the other one says there IS one, if not, we delete the links
      if (externalStone.mesh[stoneId]) {
        // the external stone thinks its connected to this stone
        if (externalStone.mesh[stoneId].rssi === BAD_CONNECTION) {
          // the connection from the external stone is bad, as is this one. Clear them both.
          let actions = [];
          actions.push({
            type: 'REMOVE_MESH_LINK',
            sphereId: this.sphereId,
            stoneId: this.stoneId,
            nodeId: externalId,
            __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
          });
          actions.push({
            type: 'REMOVE_MESH_LINK',
            sphereId: this.sphereId,
            stoneId: externalId,
            nodeId: this.stoneId,
            __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
          });
          this.store.batchDispatch(actions);
        }
        else {
          // the connection from the external stone is OK, this one is bad. Store it as a bad connection
          this.store.dispatch({
            type: 'SET_MESH_INDICATOR',
            sphereId: this.sphereId,
            stoneId: this.stoneId,
            nodeId: externalId,
            data: {rssi: BAD_CONNECTION},
            __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
          });
        }
      }
      else if (stone.mesh[externalId]) {
        // the crownstone currently has a link in the store

        // its already bad, clean it up.
        if (stone.mesh[externalId].rssi === BAD_CONNECTION) {
          this.store.dispatch({
            type: 'REMOVE_MESH_LINK',
            sphereId: this.sphereId,
            stoneId: this.stoneId,
            nodeId: externalId,
            __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
          })
        }
        else {
          // there is an existing link which is not bad, what do we do here?
          this.store.dispatch({
            type: 'SET_MESH_INDICATOR',
            sphereId: this.sphereId,
            stoneId: this.stoneId,
            nodeId: externalId,
            data: {rssi: BAD_CONNECTION},
            __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
          });
        }
      }
      else {
        // the external stone is not connected to this stone, nor is this stone connected to the external one.
        // this means we do not have to do anything.
      }
    }
    else {
      this.store.dispatch({
        type: 'SET_MESH_INDICATOR',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        nodeId: externalId,
        data: {rssi: rssi},
        __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      });
    }
  }


  /**
   * This stone entity has sent an advertisement containing the state of ANOTHER crownstone. Handle this.
   * @param stoneId
   * @param stoneId
   * @param externalId
   * @param externalStone
   * @param stoneId
   * @param externalId
   * @param externalStone
   * @param stone
   * @param externalId
   * @param externalStone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleAdvertisementOfExternalCrownstone(stoneId: string, stone, externalId: string, externalStone, advertisement : crownstoneAdvertisement) {
    this._updateStoneLastSeen(stone);

    // if this crownstone was disabled, change this since we saw it directly
    this._updateExternalRssiIndicator(stoneId, stone, externalId, externalStone, advertisement.serviceData.rssiOfExternalCrownstone);

    /// tell the rest of the app this stone was seen, and its meshnetwork was heard from.
    this._emitUpdateEvents(stone, advertisement.rssi); // emit
  }


  /**
   * This stone entity has sent an advertisement containing it's own state. Handle this.
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleDirectAdvertisement(stone, advertisement : crownstoneAdvertisement) {
    this._updateStoneLastSeen(stone);

    // update the state entity
    this._handleAdvertisementContent(stone, advertisement);

    // tell the rest of the app this stone was seen, and its meshnetwork was heard from.
    this._emitUpdateEvents(stone, advertisement.rssi); // emit
  }


  /**
   * This stones service data was advertised by another crownstone
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleContentViaMesh(stone, advertisement : crownstoneAdvertisement) {
    core.eventBus.emit(Util.events.getViaMeshTopic(this.sphereId, stone.config.meshNetworkId), {
      id: this.stoneId,
      serviceData: advertisement.serviceData
    });

    // update the state entity
    this._handleAdvertisementContent(stone, advertisement);
  }


  /**
   * Handle the data in the serviceData of the advertisement. This data belongs to this entity
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   * @private
   */
  _handleAdvertisementContent(stone, advertisement : crownstoneAdvertisement) {
    if (advertisement.serviceData.stateOfExternalCrownstone && advertisement.serviceData.timeSet === false) {
      LOGd.advertisements("StoneEntity: IGNORE: we will not apply a mesh state from a Crownstone that does not have the time.");
      return;
    }

    // these timestamps are in seconds.
    let dtWithLastDataPoint = advertisement.serviceData.timestamp - this.lastKnownTimestamp;
    if (advertisement.serviceData.timestamp !== -1 && dtWithLastDataPoint <= 0 && Math.abs(dtWithLastDataPoint) < 2000) { // the ABS is to make sure an incorrect overflow correction will not block advertisements for hours.
      LOGd.advertisements("StoneEntity: IGNORE: we already know a newer state.");
      return;
    }
    else if (this.lastKnownUniqueElement === advertisement.serviceData.uniqueElement) { // this is a fallback for before 2.0.0 firmware. The lastKnownUniqueElement is not perse a timestamp.
      LOGd.advertisements("StoneEntity: IGNORE: already seen this message.");
      return;
    }

    // ensure we do not re-use old data
    this.lastKnownUniqueElement = advertisement.serviceData.uniqueElement;
    this.lastKnownTimestamp     = advertisement.serviceData.timestamp;

    if (this.ignoreAdvertisements === true) {
      let allowData = this._checkForClearConditions(stone, advertisement);
      LOGd.advertisements('StoneEntity: IGNORE: ignore timeout is set for this Crownstone.');
      if (!allowData) {
        return;
      }
    }

    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOGd.advertisements('StoneEntity: IGNORE: DFU reset is required for this Crownstone.');
      return
    }

    // this handles the case where the type of a device changes. Most likely a dongle that is changed into a hub by the hubMode command.
    if (advertisement.serviceData.stateOfExternalCrownstone == false && stone.config.type !== deviceTypeMap[advertisement.serviceData.deviceType]) {
      core.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.sphereId, stoneId: this.stoneId, data: {type: deviceTypeMap[advertisement.serviceData.deviceType]}});
    }

    if (advertisement.serviceData.deviceType === "hub") {
      this.handleHubData(stone, advertisement);
    }
    else {
      this.handleConfig(stone, advertisement);
      this.handleAbilities(stone, advertisement);
      this.handleErrors(stone, advertisement);
    }


    if (!advertisement.serviceData.errorMode) {
      this.handleState(stone, advertisement);
    }
  }


  handleHubData(stone, advertisement: crownstoneAdvertisement) {
    let hubItem = null;
    if (this.hubId) {
      hubItem = DataUtil.getHubById(this.sphereId, this.hubId);
    }
    if (!hubItem) {
      let hub = DataUtil.getHubByStoneId(this.sphereId, this.stoneId);
      if (hub) {
        this.hubId = hub.id;
        hubItem = hub;
      }
    }

    if (!hubItem) { return; }

    let updatedState : any = {};

    if (hubItem.state.uartAlive                          !== advertisement.serviceData.uartAlive                         ) { updatedState.uartAlive                          = advertisement.serviceData.uartAlive                         ; }
    if (hubItem.state.uartAliveEncrypted                 !== advertisement.serviceData.uartAliveEncrypted                ) { updatedState.uartAliveEncrypted                 = advertisement.serviceData.uartAliveEncrypted                ; }
    if (hubItem.state.uartEncryptionRequiredByCrownstone !== advertisement.serviceData.uartEncryptionRequiredByCrownstone) { updatedState.uartEncryptionRequiredByCrownstone = advertisement.serviceData.uartEncryptionRequiredByCrownstone; }
    if (hubItem.state.uartEncryptionRequiredByHub        !== advertisement.serviceData.uartEncryptionRequiredByHub       ) { updatedState.uartEncryptionRequiredByHub        = advertisement.serviceData.uartEncryptionRequiredByHub       ; }
    if (hubItem.state.hubHasBeenSetup                    !== advertisement.serviceData.hubHasBeenSetup                   ) { updatedState.hubHasBeenSetup                    = advertisement.serviceData.hubHasBeenSetup                   ; }
    if (hubItem.state.hubHasInternet                     !== advertisement.serviceData.hubHasInternet                    ) { updatedState.hubHasInternet                     = advertisement.serviceData.hubHasInternet                    ; }
    if (hubItem.state.hubHasError                        !== advertisement.serviceData.hubHasError                       ) { updatedState.hubHasError                        = advertisement.serviceData.hubHasError                       ; }

    if (Object.keys(updatedState).length > 0) {
      core.store.dispatch({type:"UPDATE_HUB_STATE", sphereId: this.sphereId, hubId: this.hubId, data: updatedState });
    }
  }

  /**
   * This function will check if the ignore conditions are validated and the dataflow can be resumed.
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   * @returns {boolean}
   * @private
   */
  _checkForClearConditions(stone, advertisement : crownstoneAdvertisement) {
    if (this.ignoreConditions) {
      let result = true;
      if (Array.isArray(this.ignoreConditions)) {
        for (let i = 0; i < this.ignoreConditions.length; i++) {
          let condition : condition = this.ignoreConditions[i];

          if (condition.type === CONDITION_MAP.SWITCH_STATE) {
            let switchState = Math.min(100,advertisement.serviceData[condition.type]);
            if (switchState !== condition.expectedValue) {
              result = false;
              break;
            }
          }
          else {
            if (advertisement.serviceData[condition.type] !== condition.expectedValue) {
              result = false;
              break;
            }
          }
        }

        // clean up timeout
        if (result === true) {
          core.eventBus.emit(Util.events.getIgnoreConditionFulfilledTopic(this.stoneId));
          LOGi.advertisements("StoneEntity: Conditions met for cancellation of advertisement ignore.");
          this._clearTimeout();
        }

        return result;
      }
      else {
        LOGw.advertisements("StoneEntity: ILLEGAL IGNORECONDITION. EXPETED ARRAY");
      }
    }

    return false;
  }

  _clearTimeout() {
    this.ignoreConditions = null;
    this.ignoreAdvertisements = false;
    if (typeof this.ignoreTimeout === 'function') {
      this.ignoreTimeout();
      this.ignoreTimeout = null;
    }
  }

  /**
   * This will take any configuration from the Crownstone that we don't currently have up to date in the app and update it
   * This goes for:
   *  Locked
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleConfig(stone, advertisement : crownstoneAdvertisement) {
    if (stone.config.locked !== advertisement.serviceData.switchLocked) {
      this.storeManager.loadAction(this.stoneId, UPDATE_CONFIG_FROM_ADVERTISEMENT, {
        type: 'UPDATE_STONE_CONFIG',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: { locked: advertisement.serviceData.switchLocked },
        updatedAt: Date.now(),
      });
    }
  }

  /**
   * This will take any abilities from the Crownstone that we don't currently have up to date in the app and update it
   * This goes for:
   *  dimming
   *  switchcraft
   *  tapToToggle
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleAbilities(stone, advertisement : crownstoneAdvertisement) {
    let actions = [];

    if (stone.abilities.dimming.syncedToCrownstone &&
        (stone.abilities.dimming.enabled !== stone.abilities.dimming.enabledTarget ||
          stone.abilities.dimming.enabled !== advertisement.serviceData.dimmingAllowed)) {
      actions.push({ type: "UPDATE_ABILITY_DIMMER", sphereId : this.sphereId, stoneId: this.stoneId, data: {
        enabled:       advertisement.serviceData.dimmingAllowed,
        enabledTarget: advertisement.serviceData.dimmingAllowed,
      }});
      actions.push({ type: "MARK_ABILITY_DIMMER_AS_SYNCED", sphereId: this.sphereId, stoneId: this.stoneId});
    }

    if (stone.abilities.switchcraft.syncedToCrownstone &&
        (stone.abilities.switchcraft.enabled !== stone.abilities.switchcraft.enabledTarget ||
         stone.abilities.switchcraft.enabled !== advertisement.serviceData.switchCraftEnabled)) {
      actions.push({ type: "UPDATE_ABILITY_SWITCHCRAFT", sphereId : this.sphereId, stoneId: this.stoneId, data: {
          enabled:       advertisement.serviceData.switchCraftEnabled,
          enabledTarget: advertisement.serviceData.switchCraftEnabled,
        }});
      actions.push({ type: "MARK_ABILITY_SWITCHCRAFT_AS_SYNCED", sphereId: this.sphereId, stoneId: this.stoneId});
    }

    if (stone.abilities.tapToToggle.syncedToCrownstone &&
      (stone.abilities.tapToToggle.enabled !== stone.abilities.tapToToggle.enabledTarget ||
        stone.abilities.tapToToggle.enabled !== advertisement.serviceData.tapToToggleEnabled)) {
      actions.push({ type: "UPDATE_ABILITY_TAP_TO_TOGGLE", sphereId : this.sphereId, stoneId: this.stoneId, data: {
          enabled:       advertisement.serviceData.tapToToggleEnabled,
          enabledTarget: advertisement.serviceData.tapToToggleEnabled,
        }});
      actions.push({ type: "MARK_ABILITY_TAP_TO_TOGGLE_AS_SYNCED", sphereId: this.sphereId, stoneId: this.stoneId});
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  }


  _errorsHaveChanged(stoneErrors, advertisementErrors : errorData) {
    if (stoneErrors.hasError === false) {
      return true;
    }
    if (
      stoneErrors.overCurrent       !== advertisementErrors.overCurrent       ||
      stoneErrors.overCurrentDimmer !== advertisementErrors.overCurrentDimmer ||
      stoneErrors.temperatureChip   !== advertisementErrors.temperatureChip   ||
      stoneErrors.temperatureDimmer !== advertisementErrors.temperatureDimmer ||
      stoneErrors.dimmerOnFailure   !== advertisementErrors.dimmerOnFailure   ||
      stoneErrors.dimmerOffFailure  !== advertisementErrors.dimmerOffFailure
    ) {
      return true;
    }

    return false;
  }

  handleErrors(stone, advertisement : crownstoneAdvertisement) {
    if (xUtil.versions.canIUse(stone.config.firmwareVersion, '2.0.0')) {
      if (advertisement.serviceData.hasError === true) {
        // LOGe.advertisements("StoneEntity: GOT ERROR", advertisement.serviceData);
        if (advertisement.serviceData.errorMode) {
          // only mark as error is it is not already marked as error
          if (stone.errors.hasError === false) {
            this.store.dispatch({
              type: 'UPDATE_STONE_ERRORS',
              sphereId: this.sphereId,
              stoneId: this.stoneId,
              data: { hasError: true }
            });
            if (Permissions.inSphere(this.sphereId).canClearErrors) {
              core.eventBus.emit('showErrorOverlay', {stoneId: this.stoneId, sphereId: this.sphereId});
            }
          }

          // store errors in the db
          if (this._errorsHaveChanged(stone.errors, advertisement.serviceData.errors)) {
            this.store.dispatch({
              type: 'UPDATE_STONE_ERRORS',
              sphereId: this.sphereId,
              stoneId: this.stoneId,
              data: {
                overCurrent:       advertisement.serviceData.errors.overCurrent,
                overCurrentDimmer: advertisement.serviceData.errors.overCurrentDimmer,
                temperatureChip:   advertisement.serviceData.errors.temperatureChip,
                temperatureDimmer: advertisement.serviceData.errors.temperatureDimmer,
                dimmerOnFailure:   advertisement.serviceData.errors.dimmerOnFailure,
                dimmerOffFailure:  advertisement.serviceData.errors.dimmerOffFailure,
              }
            });
            LOGe.info("CROWNSTONE ERROR stoneId", this.stoneId, 'sphereId:', this.sphereId, "serviceData:", advertisement.serviceData, "errors:", advertisement.serviceData.errors, "stoneConfig", stone.config);
            if (Permissions.inSphere(this.sphereId).canClearErrors) {
              core.eventBus.emit('updateErrorOverlay', {stoneId: this.stoneId, sphereId: this.sphereId});
            }
          }
        }
      }
      else if (stone.errors.hasError === true) {
        LOGi.advertisements("StoneEntity: GOT NO ERROR WHERE THERE WAS AN ERROR BEFORE", advertisement.serviceData);
        this.store.dispatch({
          type:     'CLEAR_STONE_ERRORS',
          sphereId: this.sphereId,
          stoneId:  this.stoneId,
        });
      }
    }
  }


  handleState(stone, advertisement : crownstoneAdvertisement) {
    let serviceData = advertisement.serviceData;
    let measuredUsage = Math.floor(serviceData.powerUsageReal);
    let powerFactor = serviceData.powerFactor;
    let currentTime = Date.now();

    let switchState = Math.min(100,serviceData.switchState);

    // small aesthetic fix: force no measurement when its supposed to be off.
    if (switchState === 0 && measuredUsage !== 0) {
      measuredUsage = 0;
    }

    // hide negative measurements from the user
    if (measuredUsage < 0) {
      measuredUsage = 0;
    }

    let changeData : any = {};
    let changed = false;
    if (stone.state.state !== switchState) {
      changed = true;
      changeData.state = switchState;
    }

    if (stone.state.currentUsage !== measuredUsage) {
      changed = true;
      changeData.currentUsage = measuredUsage;
      changeData.powerFactor = powerFactor;
    }

    if (stone.state.dimmerReady !== advertisement.serviceData.dimmerReady) {
      changed = true;
      changeData.dimmerReady = advertisement.serviceData.dimmerReady;
    }

    if (stone.state.timeSet !== advertisement.serviceData.timeSet) {
      changed = true;
      changeData.timeSet = advertisement.serviceData.timeSet;
    }
    if (stone.state.behaviourOverridden !== advertisement.serviceData.behaviourOverridden) {
      changed = true;
      changeData.behaviourOverridden = advertisement.serviceData.behaviourOverridden;
    }

    if (changed) {
      this.storeManager.loadAction(this.stoneId, UPDATE_STATE_FROM_ADVERTISEMENT, {
        type: 'UPDATE_STONE_STATE',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: changeData,
        updatedAt: currentTime,
        __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      });
    }

  }


  /**
   * Util method to avoid code duplication
   * @private
   */
  _updateStoneLastSeen(stone) {
    let now = Date.now();
    // only update if the difference is more than 3 seconds.
    if (now - stone.reachability.lastSeen > 3000) {
      this.storeManager.loadAction(this.stoneId, UPDATE_STONE_TIME_LAST_SEEN, {
        type: 'UPDATE_STONE_REACHABILITY',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: {
          lastSeen: Date.now(),
        },
        __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      });
    }
  }
}


const deviceTypeMap = {
  undefined     : 'undefined',
  plug          : STONE_TYPES.plug,
  guidestone    : STONE_TYPES.guidestone,
  builtin       : STONE_TYPES.builtin,
  crownstoneUSB : STONE_TYPES.crownstoneUSB,
  builtinOne    : STONE_TYPES.builtinOne,
  hub           : STONE_TYPES.hub,
}