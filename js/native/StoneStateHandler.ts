import { LocationHandler } from '../native/LocationHandler';
import { IndividualStoneTracker } from '../native/IndividualStoneTracker';
import { Scheduler } from '../logic/Scheduler';
import { LOG } from '../logging/Log'
import { Util } from '../util/Util'
import { eventBus } from '../util/eventBus'
import { DISABLE_TIMEOUT } from '../ExternalConfig'


let TRIGGER_ID = "RSSI_TRIGGER_FUNCTION";
let RSSI_TIMEOUT = 2500;
let RSSI_REFRESH = 1;
/**
 * This class keeps track of the disability state of the crownstone.
 *
 * If a Crownstone is disabled, it means it has not been heard for the last 30 seconds, ibeacon, adv or via mesh.
 */
class StoneStateHandlerClass {
  store  : any;
  timeoutActions : any = {};
  advertisementIdsPerStoneId : any = {};
  stonesThatUpdate : any = {};
  _initialized : boolean = false;

  constructor() {
    this.store = {};

    // create a trigger to throttle the updates.
    Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: RSSI_REFRESH});
  }

  loadStore(store) {
    LOG.info('LOADED STORE StoneStateHandlerClass', this._initialized);
    if (this._initialized === false) {
      this.store = store;

      Util.data.callOnAllStones(this.store.getState(), (sphereId, stoneId, stone) => {
        // create an individual tracker for each stone to keep track of the mesh.
        if (this.stonesThatUpdate[sphereId + stoneId] === undefined) {
          LOG.info("Creating IndividualStoneTracker for sphere: ", sphereId, 'stone:', stone.config.name, '(',stoneId,')');
          this.stonesThatUpdate[sphereId + stoneId] = new IndividualStoneTracker(this.store, sphereId, stoneId);
        }
      })
    }
  }

  receivedIBeaconUpdate(sphereId, stone, stoneId, rssi) {
    // internal event to tell the app this crownstone has been seen.
    eventBus.emit('update_'+sphereId+'_'+stoneId, rssi);
    if (stone.config.meshNetworkId) {
      eventBus.emit('updateMeshNetwork_' + sphereId + stone.config.meshNetworkId, {
        handle: stone.config.handle,
        id: stoneId,
        rssi: rssi
      });
    }

    // only update rssi if there is a measurable difference and check if rssi is smaller than 0 to make sure its a valid measurement.
    if (Math.abs(stone.config.rssi - rssi) > 3 && rssi < 0) {
      // update RSSI, we only use the iBeacon once since it has an average rssi
      Scheduler.loadOverwritableAction(TRIGGER_ID, stoneId, {
        type: 'UPDATE_STONE_RSSI',
        sphereId: sphereId,
        stoneId: stoneId,
        data: {rssi: rssi}
      });
  }

    this.update(sphereId, stoneId);
  }

  receivedUpdate(sphereId, stone, stoneId, rssi) {
    // internal event to tell the app this crownstone has been seen.
    eventBus.emit('update_'+sphereId+'_'+stoneId, rssi);
    if (stone.config.meshNetworkId) {
      eventBus.emit('updateMeshNetwork_' + sphereId + stone.config.meshNetworkId, {
        handle: stone.config.handle,
        id: stoneId,
        rssi: rssi
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
  receivedUpdateViaMesh(sphereId: string, remoteStoneId: string, meshNetworkId: number, randomFromServiceData : string, advertisingStoneId : string, serviceData) {
    // emit the mesh update event only for unique advertisements. Due to ibeacon connectable on/off the unique filter is not always working.
    if (this.advertisementIdsPerStoneId[advertisingStoneId] && this.advertisementIdsPerStoneId[advertisingStoneId] !== randomFromServiceData) {
      eventBus.emit('updateViaMeshNetwork_' + sphereId + meshNetworkId, {
        id: remoteStoneId,
        serviceData: serviceData
      });
    }
    this.advertisementIdsPerStoneId[advertisingStoneId] = randomFromServiceData;

    // update the visibility of the Crownstone
    this.update(sphereId, remoteStoneId);
  }

  update(sphereId, stoneId) {
    // create an individual tracker for each stone to keep track of the mesh.
    if (this.stonesThatUpdate[sphereId + stoneId] === undefined) {
      LOG.info("Dynamically creating IndividualStoneTracker for sphere: ", sphereId, '(',stoneId,')');
      this.stonesThatUpdate[sphereId + stoneId] = new IndividualStoneTracker(this.store, sphereId, stoneId);
    }

    // LOG.info("StoneStateHandlerUpdate", sphereId, stoneId);
    const state = this.store.getState();

    // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
    if (state.spheres[sphereId].config.present === false) {
      LOG.warn("StoneStateHandler: FORCE ENTER SPHERE BY ADVERTISEMENT UPDATE (or ibeacon)");
      LocationHandler.enterSphere(sphereId);
    }

    // if we hear this stone and yet it is set to disabled, we re-enable it.
    if (state.spheres[sphereId].stones[stoneId].config.disabled === true) {
      this.store.dispatch({
        type: 'UPDATE_STONE_DISABILITY',
        sphereId: sphereId,
        stoneId: stoneId,
        data: {disabled: false}
      });
    }

    if (this.timeoutActions[sphereId] === undefined) {
      this.timeoutActions[sphereId] = {};
    }
    if (this.timeoutActions[sphereId][stoneId] === undefined) {
      this.timeoutActions[sphereId][stoneId] = {clearTimeout: undefined, clearRSSITimeout: undefined};
    }

    if (this.timeoutActions[sphereId][stoneId].clearTimeout && typeof this.timeoutActions[sphereId][stoneId].clearTimeout === 'function') {
      // LOG.info("Cancelling_Timeout");
      this.timeoutActions[sphereId][stoneId].clearTimeout();
    }

    if (this.timeoutActions[sphereId][stoneId].clearRSSITimeout && typeof this.timeoutActions[sphereId][stoneId].clearRSSITimeout === 'function') {
      // LOG.info("Cancelling_RSSI_Timeout");
      this.timeoutActions[sphereId][stoneId].clearRSSITimeout();
    }

    let disableCallback = () => {
      let state = this.store.getState();
      if (state.spheres[sphereId] && state.spheres[sphereId].stones[stoneId]) {
        // check if there are any stones left that are not disabled.
        let otherStoneIds = Object.keys(state.spheres[sphereId].stones);
        let allDisabled = true;
        otherStoneIds.forEach((otherStoneId) => {
          if (otherStoneId !== stoneId) {
            if (state.spheres[sphereId].stones[otherStoneId].config.disabled === false) {
              allDisabled = false;
            }
          }
        });

        // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
        if (allDisabled === true) {
          LOG.info("StoneStateHandler: FORCE LEAVING SPHERE DUE TO ALL CROWNSTONES BEING DISABLED");
          LocationHandler.exitSphere(sphereId);
        }

        LOG.info("StoneStateHandler: Disabling stone ", stoneId);
        this.store.dispatch({
          type: 'UPDATE_STONE_DISABILITY',
          sphereId: sphereId,
          stoneId: stoneId,
          data: {disabled: true, rssi: -1000}
        });
      }
      this.timeoutActions[sphereId][stoneId].clearTimeout = undefined;
      delete this.timeoutActions[sphereId][stoneId].clearTimeout;
    };

    let clearRSSICallback = () => {
      this.store.dispatch({
        type: 'UPDATE_STONE_RSSI',
        sphereId: sphereId,
        stoneId: stoneId,
        data: {rssi: -1000}
      });
      this.timeoutActions[sphereId][stoneId].clearRSSITimeout = undefined;
      delete this.timeoutActions[sphereId][stoneId].clearRSSITimeout;
    };

    this.timeoutActions[sphereId][stoneId].clearTimeout = Scheduler.scheduleCallback(disableCallback, DISABLE_TIMEOUT, "disable_" + stoneId + "_");
    this.timeoutActions[sphereId][stoneId].clearRSSITimeout = Scheduler.scheduleCallback(clearRSSICallback, RSSI_TIMEOUT, "updateRSSI_" + stoneId + "_");
  }

}

export const StoneStateHandler = new StoneStateHandlerClass();