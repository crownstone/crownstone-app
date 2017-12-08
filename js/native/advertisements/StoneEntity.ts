import {LOG_LEVEL} from "../../logging/LogLevels";
import {LOG} from "../../logging/Log";
import {DISABLE_TIMEOUT, FALLBACKS_ENABLED, HARDWARE_ERROR_REPORTING} from "../../ExternalConfig";
import {eventBus} from "../../util/EventBus";
import {Util} from "../../util/Util";
import {Scheduler} from "../../logic/Scheduler";
import {DfuStateHandler} from "../firmware/DfuStateHandler";
import {IndividualStoneTracker} from "./IndividualStoneTracker";
import {LocationHandler} from "../localization/LocationHandler";
import {StoneMeshTracker} from "./StoneMeshTracker";
import {StoneBehaviour} from "./StoneBehaviour";

let TRIGGER_ID = "RSSI_TRIGGER_FUNCTION";
let RSSI_TIMEOUT = 5000;
let RSSI_REFRESH = 1;
/**
 * This will control a stone. It will make sure advertisements will update its state and keep track of its position in the mesh.
 */
export class StoneEntity {

  stoneId;
  sphereId;
  store;
  storeManager;
  meshTracker;
  behaviour;

  disabledTimeout;
  clearRssiTimeout;

  connecting;

  constructor(store, storeManager, sphereId, stoneId) {
    this.store = store;
    this.storeManager = storeManager;
    this.sphereId = sphereId;
    this.stoneId = stoneId;

    this.behaviour   = new StoneBehaviour(store, sphereId, stoneId);
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
    eventBus.on("connect", (handle) => {
      // TODO: update this to the StoneStoreManager
      Scheduler.clearOverwritableTriggerAction(TRIGGER_ID, ADVERTISEMENT_PREFIX + handle);
    });

  }

  destroy() {

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
    this._updateRssi(ibeaconPackage.rssi);

    // fallback to ensure we never miss an enter event caused by a bug in ios 10
    if (FALLBACKS_ENABLED) {
      if (state.spheres[this.sphereId].config.present === false) {
        LOG.warn("FALLBACK: StoneEntity: FORCE ENTER SPHERE BY ADVERTISEMENT UPDATE (or ibeacon)");
        LocationHandler.enterSphere(this.sphereId);
      }
    }

    // update the behaviour controller.
    this.behaviour.ibeaconUpdate(ibeaconPackage);
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
    };

    this.disabledTimeout  = Scheduler.scheduleBackgroundCallback(disableCallback, DISABLE_TIMEOUT, "disable_" + this.stoneId + "_");
  }

  _updateRssi(rssi) {
    const state = this.store.getState();
    if (!this._validate(state)) { return; }
    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // only update rssi if there is a measurable difference and check if rssi is smaller than 0 to make sure its a valid measurement.
    if (Math.abs(stone.config.rssi - rssi) > 1 && rssi < 0) {
      // update RSSI, we only use the iBeacon once since it has an average rssi
      // TODO: use StoneStoreManager
      // Scheduler.loadOverwritableAction(TRIGGER_ID, this.stoneId, {
      //   type: 'UPDATE_STONE_RSSI',
      //   sphereId: this.sphereId,
      //   stoneId: this.stoneId,
      //   data: { rssi: ibeaconPackage.rssi, lastSeen: new Date().valueOf() },
      //   __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      // });
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

  handleAdvertisementOfExternalCrownstone() {
    // TODO : only log time last seen
    this._emitUpdateEvents() // emit
  }


  handleDirectAdvertisement(advertisement : crownstoneAdvertisement) {
    // TODO : log last seen
    this.handleAdvertisementContent(advertisement);

    this._updateDisabledState();

    this._emitUpdateEvents() // emit
  }

  handleContentViaMesh(advertisement : crownstoneAdvertisement) {
    // TODO : log lastSeenInMesh
    this.handleAdvertisementContent(advertisement);
  }

  handleAdvertisementContent(advertisement : crownstoneAdvertisement) {
    let state = this.store.getState();
    if (!this._validate(state)) { return; }
    let sphere = state.spheres[this.sphereId];
    let stone = sphere.stones[this.stoneId];

    // handle the case of a failed DFU that requires a reset. If it boots in normal mode, we can not use it until the
    // reset is complete.
    if (stone.config.dfuResetRequired === true) {
      LOG.debug('AdvertisementHandler: IGNORE: DFU reset is required for this Crownstone.');
      return;
    }

    this.handleErrors(stone, advertisement);

    this.handleState(stone, advertisement);
    // TODO: log temperature


  }




  handleErrors(stone, advertisement) {
    if (HARDWARE_ERROR_REPORTING) {
      if (Util.versions.isHigherOrEqual(stone.config.firmwareVersion, '1.3.1')) {
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



  handleState(stone, advertisement) {
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

    if (this.temporaryIgnore !== true) {
      let action = {
        type: 'UPDATE_STONE_STATE',
        sphereId: this.sphereId,
        stoneId: this.stoneId,
        data: { state: switchState, currentUsage: measuredUsage, applianceId: stone.config..applianceId },
        updatedAt: currentTime,
        __logLevel: LOG_LEVEL.verbose, // this command only lets this log skip the LOG.store unless LOG_VERBOSE is on.
      };
      // TODO: use StoneStoreManager
    }

  }
  // rssi
  // state
  // power usage
  // disabled
  // forward to behaviour
  // keep track of mesh state



  receivedAdvertisementUpdate(sphereId, stone, stoneId, rssi) {
    let state = this.store.getState();
    if (!state.spheres[sphereId]) { return; }
    if (!state.spheres[sphereId].stones[stoneId]) { return; }

    // internal event to tell the app this crownstone has been seen.
    eventBus.emit(Util.events.getCrownstoneTopic(sphereId, stoneId), {
      handle: stone.config.handle,
      stoneId: stoneId,
      rssi: rssi,
    });

    // emit that something from this mesh network has broadcasted
    if (stone.config.meshNetworkId) {
      eventBus.emit(Util.events.getMeshTopic(sphereId, stone.config.meshNetworkId), {
        handle: stone.config.handle,
        stoneId: stoneId,
        meshNetworkId: stone.config.meshNetworkId,
        rssi: rssi,
      });
    }

    this.update(sphereId, stoneId);
  }

  /**
   *
   * @param sphereId
   * @param remoteStoneId       The remote stone id (the one who owns the payload, not the advertisement)
   * @param meshNetworkId
   * @param randomFromServiceData
   * @param advertisingStoneId
   * @param serviceData
   */
  receivedUpdateViaMesh(sphereId: string, remoteStoneId: string, meshNetworkId: number, randomFromServiceData : string, advertisingStoneId : string, serviceData: crownstoneServiceData) {
    let state = this.store.getState();
    if (!state.spheres[sphereId]) { return; }
    if (!state.spheres[sphereId].stones[remoteStoneId]) { return; }



    // update the visibility of the Crownstone
    this.update(sphereId, remoteStoneId);
  }


}