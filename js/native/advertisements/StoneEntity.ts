import { LOG_LEVEL }        from "../../logging/LogLevels";
import { LOG, LOGi } from "../../logging/Log";
import { DISABLE_TIMEOUT, FALLBACKS_ENABLED, HARDWARE_ERROR_REPORTING } from "../../ExternalConfig";
import { eventBus }         from "../../util/EventBus";
import { Util }             from "../../util/Util";
import { Scheduler }        from "../../logic/Scheduler";
import { LocationHandler }  from "../localization/LocationHandler";
import { StoneMeshTracker } from "./StoneMeshTracker";
import { StoneBehaviour }   from "./StoneBehaviour";
import { StoneStoreManager } from "./StoneStoreManager";

let RSSI_TIMEOUT = 5000;

const UPDATE_STATE_FROM_ADVERTISEMENT = 'UPDATE_STATE_FROM_ADVERTISEMENT';
const UPDATE_STONE_TIME_LAST_SEEN     = 'UPDATE_STONE_TIME_LAST_SEEN';
const UPDATE_STONE_TIME_LAST_SEEN_VIA_MESH = 'UPDATE_STONE_TIME_LAST_SEEN_VIA_MESH';
const UPDATE_STONE_RSSI               = 'UPDATE_STONE_RSSI';

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
  behaviour : StoneBehaviour;

  disabledTimeout;
  clearRssiTimeout;

  constructor(store, storeManager, sphereId, stoneId) {
    LOGi.native("StoneEntity: Creating entity for ", stoneId);
    this.store = store;
    this.storeManager = storeManager;
    this.sphereId = sphereId;
    this.stoneId = stoneId;

    this.behaviour   = new StoneBehaviour(  store, sphereId, stoneId);
    this.meshTracker = new StoneMeshTracker(store, sphereId, stoneId);

    this.subscribe();
  }


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
    this.subscriptions.push(eventBus.on("connect", (handle) => {
      let state = this.store.getState();
      let sphere = state.spheres[this.sphereId];
      let stone = sphere.stones[this.stoneId];

      if (stone.config.handle === handle) {
        this.storeManager.clearActions(this.stoneId);
      }
    }));
  }


  destroy() {
    this.storeManager.clearActions(this.stoneId);
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.behaviour.destroy();
    this.meshTracker.destroy();
  }


  ibeaconUpdate(ibeaconPackage : ibeaconPackage) {
    let state = this.store.getState();
    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOG.debug("AdvertisementHandler: IGNORE: DFU reset is required for this Crownstone.");
      return;
    }

    // If the app has not yet seen this Crownstone, it could be that it does not have a handle.
    // Without handle we do not propagate the update events since we do not know what how to connect to it
    // if we only hear the ibeacon event.
    if (stone.config.handle) {
      this._emitUpdateEvents(stone, ibeaconPackage.rssi);
    }
    else {
      LOG.debug("StoneStateHandler: IGNORE iBeacon message: store has no handle.");
    }

    this._updateDisabledState();

    // update RSSI, we only use the iBeacon once since it has an average rssi
    this._updateRssi(ibeaconPackage.rssi);

    // fallback to ensure we never miss an enter event caused by a bug in ios 10
    if (FALLBACKS_ENABLED) {
      if (state.spheres[this.sphereId].config.present === false) {
        LOG.warn("FALLBACK: StoneEntity: FORCE ENTER SPHERE BY ADVERTISEMENT UPDATE (or ibeacon)");
        LocationHandler.enterSphere(this.sphereId);
      }
    }

    // update the behaviour controller.
    this.behaviour.ibeaconUpdate(state, stone, ibeaconPackage);
  }


  _emitUpdateEvents(stone, rssi) {
    // These events are used in the Batch Command Handler
    eventBus.emit(Util.events.getCrownstoneTopic(this.sphereId, this.stoneId), {
      handle: stone.config.handle,
      stoneId: this.stoneId,
      rssi: rssi,
    });

    if (stone.config.meshNetworkId) {
      eventBus.emit(Util.events.getMeshTopic(this.sphereId, stone.config.meshNetworkId), {
        handle: stone.config.handle,
        stoneId: this.stoneId,
        meshNetworkId: stone.config.meshNetworkId,
        rssi: rssi,
      });
    }
  }


  _updateDisabledState() {
    const state = this.store.getState();
    if (!this._validate(state)) { return; }

    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // if we hear this stone and yet it is set to disabled, we re-enable it.
    if (stone.config.disabled === true) {
      this.store.dispatch({
        type: 'UPDATE_STONE_DISABILITY',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: {disabled: false}
      });
    }

    if (this.disabledTimeout && typeof this.disabledTimeout === 'function') {
      this.disabledTimeout();
    }

    let disableCallback = () => {
      // cleanup
      this.disabledTimeout = undefined;

      let state = this.store.getState();
      if (!this._validate(state)) { return; }

      LOG.info("StoneStateHandler: Disabling stone ", this.stoneId);
      this.store.dispatch({
        type: 'UPDATE_STONE_DISABILITY',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: {disabled: true, rssi: -1000}
      });

      eventBus.emit("CrownstoneDisabled", this.sphereId);
    };

    this.disabledTimeout = Scheduler.scheduleBackgroundCallback(disableCallback, DISABLE_TIMEOUT, "disable_" + this.stoneId + "_");
  }


  _updateRssi(rssi) {
    const state = this.store.getState();
    if (!this._validate(state)) { return; }
    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // only update rssi if there is a measurable difference and check if rssi is smaller than 0 to make sure its a valid measurement.
    if (stone.config.rssi !== rssi && rssi < 0) {
      this.storeManager.loadAction(this.stoneId, UPDATE_STONE_RSSI, {
        type: 'UPDATE_STONE_RSSI',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: { rssi: rssi },
        __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      });
    }

    if (this.clearRssiTimeout && typeof this.clearRssiTimeout === 'function') {
      this.clearRssiTimeout();
    }

    let clearRSSICallback = () => {
      this.store.dispatch({
        type: 'UPDATE_STONE_RSSI',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: {rssi: -1000}
      });
      this.clearRssiTimeout = undefined;
      delete this.clearRssiTimeout;
    };

    this.clearRssiTimeout = Scheduler.scheduleCallback(clearRSSICallback, RSSI_TIMEOUT, "updateRSSI_" + this.stoneId + "_");
  }


  /**
   * This stone entity has sent an advertisement containing the state of ANOTHER crownstone. Handle this.
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleAdvertisementOfExternalCrownstone(stone, advertisement : crownstoneAdvertisement) {
    this._updateStoneLastSeen();

    // if this crownstone was disabled, change this since we saw it directly
    this._updateDisabledState();

    /// tell the rest of the app this stone was seen, and its meshnetwork was heard from.
    this._emitUpdateEvents(stone, advertisement.rssi) // emit
  }


  /**
   * This stone entity has sent an advertisement containing it's own state. Handle this.
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleDirectAdvertisement(stone, advertisement : crownstoneAdvertisement) {
    this._updateStoneLastSeen();

    // if this crownstone was disabled, change this since we saw it directly
    this._updateDisabledState();

    // update the state entity
    this._handleAdvertisementContent(stone, advertisement);

    // tell the rest of the app this stone was seen, and its meshnetwork was heard from.
    this._emitUpdateEvents(stone, advertisement.rssi) // emit
  }


  /**
   * This stones service data was advertised by another crownstone
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   */
  handleContentViaMesh(stone, advertisement : crownstoneAdvertisement) {
    eventBus.emit(Util.events.getViaMeshTopic(this.sphereId, stone.config.meshNetworkId), {
      id: this.stoneId,
      serviceData: advertisement.serviceData
    });

    // if this crownstone was disabled, change this since we saw it indirectly
    this._updateDisabledState();

    // update the state entity
    this._handleAdvertisementContent(stone, advertisement);

    // last seen via mesh.
    this.storeManager.loadAction(this.stoneId, UPDATE_STONE_TIME_LAST_SEEN_VIA_MESH, {
      type: 'UPDATE_STONE_DIAGNOSTICS',
      sphereId: this.sphereId,
      stoneId: this.stoneId,
      data: {
        lastSeenViaMesh: new Date().valueOf(),
      },
      __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
    });
  }


  /**
   * Handle the data in the serviceData of the advertisement. This data belongs to this entity
   * @param stone
   * @param {crownstoneAdvertisement} advertisement
   * @private
   */
  _handleAdvertisementContent(stone, advertisement : crownstoneAdvertisement) {
    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOG.debug('AdvertisementHandler: IGNORE: DFU reset is required for this Crownstone.');
      return;
    }

    this.handleErrors(stone, advertisement);

    this.handleState(stone, advertisement);
  }


  handleErrors(stone, advertisement) {
    if (HARDWARE_ERROR_REPORTING) {
      if (Util.versions.canIUse(stone.config.firmwareVersion, '1.3.1')) {
        if (advertisement.serviceData.hasError === true) {
          LOG.info("GOT ERROR", advertisement.serviceData);
          eventBus.emit("errorDetectedInAdvertisement", {
            advertisement: advertisement,
            stone: stone,
            stoneId: this.stoneId,
            sphereId: this.sphereId
          });
        }
        else if (stone.errors.advertisementError === true) {
          LOG.info("GOT NO ERROR WHERE THERE WAS AN ERROR BEFORE", advertisement.serviceData);
          eventBus.emit("errorResolvedInAdvertisement", {
            advertisement: advertisement,
            stone: stone,
            stoneId: this.stoneId,
            sphereId: this.sphereId
          });
        }
      }
    }
  }


  handleState(stone, advertisement : crownstoneAdvertisement) {
    let serviceData = advertisement.serviceData;
    let measuredUsage = Math.floor(serviceData.powerUsage);

    let currentTime = new Date().valueOf();

    let switchState = Math.min(1,serviceData.switchState / 100);

    // small aesthetic fix: force no measurement when its supposed to be off.
    if (switchState === 0 && measuredUsage !== 0) {
      measuredUsage = 0;
    }

    // hide negative measurements from the user
    if (measuredUsage < 0) {
      measuredUsage = 0;
    }

    this.storeManager.loadAction(this.stoneId, UPDATE_STATE_FROM_ADVERTISEMENT, {
      type: 'UPDATE_STONE_STATE',
      sphereId: this.sphereId,
      stoneId: this.stoneId,
      data: {
        state: switchState,
        currentUsage: measuredUsage,
        applianceId: stone.config.applianceId,
        lastSeenTemperature : serviceData.temperature
      },
      updatedAt: currentTime,
      __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
    });

  }


  /**
   * Util method to avoid code duplication
   * @private
   */
  _updateStoneLastSeen() {
    this.storeManager.loadAction(this.stoneId, UPDATE_STONE_TIME_LAST_SEEN, {
      type: 'UPDATE_STONE_DIAGNOSTICS',
      sphereId: this.sphereId,
      stoneId: this.stoneId,
      data: {
        lastSeen: new Date().valueOf(),
      },
      __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
    });
  }
}