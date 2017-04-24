import { Scheduler } from '../../logic/Scheduler';
import { NativeBus } from '../libInterface/NativeBus';
import { StoneStateHandler } from './StoneStateHandler'
import { LOG } from '../../logging/Log'
import { LOG_BLE } from '../../ExternalConfig'
import { getMapOfCrownstonesInAllSpheresByHandle, getMapOfCrownstonesInAllSpheresByCID } from '../../util/DataUtil'
import { eventBus }  from '../../util/EventBus'
import { Util }  from '../../util/Util'

let TRIGGER_ID = 'CrownstoneAdvertisement';
let ADVERTISEMENT_PREFIX =  "updateStoneFromAdvertisement_";

class AdvertisementHandlerClass {
  _initialized : any;
  store : any;
  state : any;
  referenceHandleMap : any;
  referenceCIDMap : any;
  stonesInConnectionProcess : any;
  temporaryIgnore  : any;
  temporaryIgnoreTimeout : any;

  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.state = {};
    this.referenceHandleMap = {};
    this.referenceCIDMap = {};
    this.stonesInConnectionProcess = {};
    this.temporaryIgnore = false;
    this.temporaryIgnoreTimeout = undefined;
  }

  loadStore(store) {
    LOG.info('LOADED STORE AdvertisementHandler', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      this.init();
    }
  }

  init() {
    if (this._initialized === false) {
      // TODO: Make into map entity so this is only done once.
      // refresh maps when the database changes
      this.store.subscribe(() => {
        this.state = this.store.getState();
        this.referenceHandleMap = getMapOfCrownstonesInAllSpheresByHandle(this.state);
        this.referenceCIDMap = getMapOfCrownstonesInAllSpheresByCID(this.state);
      });

      // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
      eventBus.on("connect", (handle) => {
        Scheduler.clearOverwritableTriggerAction(TRIGGER_ID, ADVERTISEMENT_PREFIX + handle);
        // this is a fallback mechanism in case no disconnect event is fired.
        this.stonesInConnectionProcess[handle] = {timeout: setTimeout(() => {
          LOG.warn("(Ignore if doing setup) Force restoring listening to all crownstones since no disconnect state after 15 seconds.");
          this._restoreConnectionTimeout();
        }, 15000)};
      });

      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("disconnect", () => {
        // wait before listening to the stones again.
        Scheduler.scheduleCallback(() => {this._restoreConnectionTimeout();}, 1000);
      });

      // sometimes we need to ignore any trigger for switching because we're doing something else.
      eventBus.on("ignoreTriggers", () => {
        this.temporaryIgnore = true;
        this.temporaryIgnoreTimeout = setTimeout(() => {
          if (this.temporaryIgnore === true) {
            LOG.error("Temporary ignore of triggers has been on for more than 20 seconds!!");
          }
        }, 20000 );
      });
      eventBus.on("useTriggers", () => { this.temporaryIgnore = false; clearTimeout(this.temporaryIgnoreTimeout); });

      // create a trigger to throttle the updates.
      Scheduler.setRepeatingTrigger(TRIGGER_ID,{repeatEveryNSeconds:2});

      // listen to verified advertisements. Verified means consecutively successfully encrypted.
      NativeBus.on(NativeBus.topics.advertisement, this.handleEvent.bind(this));

      // Debug logging of all BLE related events.
      if (LOG_BLE) {
        LOG.ble("Subscribing to all BLE Topics");
        NativeBus.on(NativeBus.topics.setupAdvertisement, (data) => {
          LOG.ble('setupAdvertisement', data.name, data.rssi, data.handle, data);
        });
        NativeBus.on(NativeBus.topics.advertisement, (data) => {
          LOG.ble('crownstoneId', data.name, data.rssi, data.handle, data);
        });
        NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => {
          LOG.ble('iBeaconAdvertisement', data[0].rssi, data[0].major, data[0].minor);
        });
      }

      this._initialized = true;
    }
  }

  _restoreConnectionTimeout() {
    Object.keys(this.stonesInConnectionProcess).forEach((handle) => {
      clearTimeout(this.stonesInConnectionProcess[handle].timeout)
    });
    this.stonesInConnectionProcess = {};
  }

  handleEvent(advertisement : crownstoneAdvertisement) {
    // ignore stones that we are attempting to connect to.
    if (this.stonesInConnectionProcess[advertisement.handle] !== undefined) {
      return;
    }

    // the service data in this advertisement;
    let serviceData : crownstoneServiceData = advertisement.serviceData;

    // service data not available
    if (typeof serviceData !== 'object') {
      return;
    }

    // check if we have a state
    if (this.state.spheres === undefined) {
      return;
    }

    // only relevant if we are in a sphere.
    if (this.state.spheres[advertisement.referenceId] === undefined) {
      return;
    }

    let sphereId = advertisement.referenceId;

    // look for the crownstone in this sphere which has the same CrownstoneId (CID)
    let referenceByCrownstoneId = this.referenceCIDMap[sphereId][serviceData.crownstoneId];

    // check if we have a Crownstone with this CID, if not, ignore it.
    if (referenceByCrownstoneId === undefined) {
      return;
    }

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && referenceByCrownstoneId !== undefined) {
      if (referenceByCrownstoneId.handle != advertisement.handle) {
        this.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: advertisement.referenceId, stoneId: referenceByCrownstoneId.id, data:{handle: advertisement.handle}});
        return;
      }
    }

    let referenceByHandle = this.referenceHandleMap[sphereId][advertisement.handle];

    // unknown crownstone
    if (referenceByHandle === undefined) {
      return;
    }

    let stoneFromServiceData   = this.state.spheres[advertisement.referenceId].stones[referenceByCrownstoneId.id];
    let stoneFromAdvertisement = this.state.spheres[advertisement.referenceId].stones[referenceByHandle.id];


    // --------------------- Update the Mesh Network --------------------------- //

    // update mesh network map.
    let meshNetworkId = undefined;
    if (serviceData.stateOfExternalCrownstone === true) {
      let networkId_external = stoneFromServiceData.config.meshNetworkId;
      let networkId_advertiser = stoneFromAdvertisement.config.meshNetworkId;

      // initially it does not matter which we select.
      meshNetworkId = networkId_advertiser;

      // if these stones are not known to be in a mesh network, they are in the same, new, network.
      if (networkId_external === null && networkId_advertiser === null) {
        meshNetworkId = Math.round(Math.random()*1e6);
        let actions = [];
        actions.push(Util.mesh.getChangeMeshIdAction(sphereId, referenceByCrownstoneId.id, meshNetworkId));
        actions.push(Util.mesh.getChangeMeshIdAction(sphereId, referenceByHandle.id, meshNetworkId));
        this.store.batchDispatch(actions);
      }
      // if they are in a different mesh network, place them in the same one.
      else if (networkId_external !== networkId_advertiser) {
        if (networkId_external === null) {
          // copy mesh id from stoneFromAdvertisement to stoneFromServiceData
          meshNetworkId = networkId_advertiser;
          this.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, referenceByCrownstoneId.id, meshNetworkId));
        }
        else if (networkId_advertiser === null) {
          // copy mesh id from stoneFromServiceData to stoneFromAdvertisement
          meshNetworkId = networkId_external;
          this.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, referenceByHandle.id, meshNetworkId));
        }
        else {
          // copy the mesh id from the largest mesh to the smallest mesh
          let state = this.store.getState();
          let network_external = Util.mesh.getStonesInNetwork(state, sphereId, networkId_external);
          let network_advertiser = Util.mesh.getStonesInNetwork(state, sphereId, networkId_advertiser);

          if (network_external.length > network_advertiser.length) {
            meshNetworkId = network_external;
            Util.mesh.setNetworkId(this.store, sphereId, network_advertiser, meshNetworkId);
          }
          else {
            meshNetworkId = network_external;
            Util.mesh.setNetworkId(this.store, sphereId, network_external, meshNetworkId);
          }
        }
      }
    }

    // ----------------- END Update the Mesh Network END ----------------------- //



    let measuredUsage = Math.floor(serviceData.powerUsage * 0.001);  // usage is in milli Watts

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

    // update the state is there is new data, or if the crownstone is disabled.
    if (stoneFromServiceData.state.state != switchState          ||
        stoneFromServiceData.state.currentUsage != measuredUsage ||
        stoneFromServiceData.config.disabled === true ) {

      // sometimes we need to ignore any distance based toggling.
      if (this.temporaryIgnore !== true) {
        Scheduler.loadOverwritableAction(TRIGGER_ID,  ADVERTISEMENT_PREFIX + advertisement.handle, {
          type: 'UPDATE_STONE_STATE',
          sphereId: advertisement.referenceId,
          stoneId: referenceByCrownstoneId.id,
          data: { state: switchState, currentUsage: measuredUsage },
          updatedAt: currentTime
        });
      }
    }

    // if the advertisement contains the state of a different Crownstone, we update its disability state
    if (serviceData.stateOfExternalCrownstone === true) {
      StoneStateHandler.receivedUpdateViaMesh(sphereId, referenceByCrownstoneId.id, meshNetworkId, serviceData.random, referenceByHandle.id, serviceData);
    }

    // we always update the disability (and rssi) of the Crownstone that is broadcasting.
    StoneStateHandler.receivedAdvertisementUpdate(sphereId, stoneFromAdvertisement, referenceByCrownstoneId.id, advertisement.rssi);
  }
}

export const AdvertisementHandler : any = new AdvertisementHandlerClass();


