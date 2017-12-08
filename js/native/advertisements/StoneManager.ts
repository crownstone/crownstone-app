import {eventBus} from "../../util/EventBus";
import {LogProcessor} from "../../logging/LogProcessor";
import {DISABLE_TIMEOUT, FALLBACKS_ENABLED, HARDWARE_ERROR_REPORTING, LOG_BLE} from "../../ExternalConfig";
import {LOG} from "../../logging/Log";
import {NativeBus} from "../libInterface/NativeBus";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BlePromiseManager} from "../../logic/BlePromiseManager";
import {BleUtil} from "../../util/BleUtil";
import {BluenetPromiseWrapper} from "../libInterface/BluenetPromise";
import {Scheduler} from "../../logic/Scheduler";
import {Util} from "../../util/Util";
import {LOG_LEVEL} from "../../logging/LogLevels";
import {StoneEntity} from "./StoneEntity";
import {LocationHandler} from "../localization/LocationHandler";
import {DfuStateHandler} from "../firmware/DfuStateHandler";


let TRIGGER_ID = 'STONE_MANAGER';
let ADVERTISEMENT_PREFIX =  "updateStoneFromAdvertisement_";

/**
 * The Stone Manager receives all updates from advertisements and ibeacons
 * It dispatches these to the appropriate StoneEntities
 *
 * Entities are created and removed as required
 */
class StoneManagerClass {

  store = undefined;
  _initialized = false;
  stonesInConnectionProcess : any;
  factoryResettingCrownstones : any = {};
  temporaryIgnore = false;
  temporaryIgnoreTimeout = undefined;

  entities = {};

  loadStore(store) {
    if (this._initialized === false) {
      this.store = store;
      this._init();
    }
  }

  _init() {
    if (this._initialized === false) {
      // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
      eventBus.on("connect", (handle) => {
        // this is a fallback mechanism in case no disconnect event is fired.
        this.stonesInConnectionProcess[handle] = { timeout: Scheduler.scheduleCallback(() => {
            LOG.warn("(Ignore if doing setup) Force restoring listening to all crownstones since no disconnect state after 15 seconds.");
            this._restoreConnectionTimeout();
          }, 15000, 'ignoreProcessAdvertisementsTimeout')};
      });
      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("disconnect", () => {
        // wait before listening to the stones again.
        Scheduler.scheduleCallback(() => { this._restoreConnectionTimeout(); }, 1000,'_restoreConnectionTimeout');
      });


      // TODO: check for relevance
      // eventBus.on("ignoreTriggers", () => {
      //   this.temporaryIgnore = true;
      //   this.temporaryIgnoreTimeout = Scheduler.scheduleCallback(() => {
      //     if (this.temporaryIgnore === true) {
      //       LOG.error("Temporary ignore of triggers has been on for more than 20 seconds!!");
      //     }
      //   }, 20000, 'temporaryIgnoreTimeout');
      // });
      // eventBus.on("useTriggers", () => {
      //   this.temporaryIgnore = false;
      //   if (typeof this.temporaryIgnoreTimeout === 'function') {
      //     this.temporaryIgnoreTimeout();
      //     this.temporaryIgnoreTimeout = null;
      //   }
      // });

      // listen to verified advertisements. Verified means consecutively successfully encrypted.
      NativeBus.on(NativeBus.topics.advertisement, this.handleAdvertisement.bind(this));

      NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data : ibeaconPackage[]) => {
        data.forEach((iBeaconPackage: ibeaconPackage) => {
          this.handleIBeacon(iBeaconPackage);
        });
      });
      this._initialized = true;
    }
  }

  _restoreConnectionTimeout() {
    Object.keys(this.stonesInConnectionProcess).forEach((handle) => {
      if (typeof this.stonesInConnectionProcess[handle].timeout === 'function') {
        this.stonesInConnectionProcess[handle].timeout();
        this.stonesInConnectionProcess[handle].timeout = null;
      }
    });
    this.stonesInConnectionProcess = {};
  }

  createEntity(sphereId, stoneId) {
    this.entities[stoneId] = new StoneEntity(this.store, this.storeManager, sphereId, stoneId)
  }

  removeEntity(stoneId) {
    this.entities[stoneId].destroy();
    delete this.entities[stoneId];
  }

  handleIBeacon(ibeaconPackage : ibeaconPackage) {
    let sphereId = ibeaconPackage.referenceId;

    // only use valid rssi measurements, 0 or 128 are not valid measurements
    if (ibeaconPackage.rssi === undefined || ibeaconPackage.rssi > -1) {
      LOG.debug("StoneManager.handleIbeacon: IGNORE: no rssi.");
      return;
    }

    if (sphereId === undefined || ibeaconPackage.major  === undefined || ibeaconPackage.minor === undefined) {
      LOG.debug("StoneManager.handleIbeacon: IGNORE: no sphereId or no major or no minor.");
      return;
    }

    // check if we have the sphere
    let state = this.store.getState();
    let sphere = state.spheres[sphereId];
    if (!(sphere)) {
      LOG.debug("StoneManager.handleIbeacon: IGNORE: unknown sphere.");
      return;
    }

    // check if we have a stone with this major / minor
    let stoneId = MapProvider.stoneIBeaconMap[ibeaconPackage.uuid + '_' + ibeaconPackage.major + '_' + ibeaconPackage.minor];
    if (!(stoneId)) {
      LOG.debug("StoneManager.handleIbeacon: IGNORE: unknown stone.");
      return;
    }

    // create an entity for this crownstone if one does not exist yet.
    if (!this.entities[stoneId]) { this.createEntity(sphereId, stoneId); }

    this.entities[stoneId].ibeaconUpdate(ibeaconPackage);
  }


  handleAdvertisement(advertisement : crownstoneAdvertisement) {
    // this is on manager level, not on entity level since setup crownstones do not have an entity but do need this functionality.
    if (this.stonesInConnectionProcess[advertisement.handle] !== undefined) {
      LOG.debug("AdvertisementHandler: IGNORE: connecting to stone.");
      return;
    }

    // the service data in this advertisement;
    let serviceData : crownstoneServiceData = advertisement.serviceData;
    let state = this.store.getState();

    // service data not available
    if (typeof serviceData !== 'object') {
      LOG.debug("AdvertisementHandler: IGNORE: serviceData is not an object.");
      return;
    }

    // check if we have a state
    if (state.spheres === undefined) {
      LOG.debug("AdvertisementHandler: IGNORE: We have no spheres.");
      return;
    }

    // only relevant if we are in a sphere.
    if (state.spheres[advertisement.referenceId] === undefined) {
      LOG.debug("AdvertisementHandler: IGNORE: This specific sphere is unknown to us.");
      return;
    }

    // this is the referenceId of the spherekeys that we used to decrypt this advertisement
    let sphereId = advertisement.referenceId;

    // look for the crownstone in this sphere which has the same CrownstoneId (CID)
    let referenceByCrownstoneId = MapProvider.stoneCIDMap[sphereId][serviceData.crownstoneId];

    // check if we have a Crownstone with this CID, if not, ignore it.
    if (referenceByCrownstoneId === undefined) {
      return;
    }

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && referenceByCrownstoneId !== undefined) {
      if (referenceByCrownstoneId.handle != advertisement.handle) {
        LOG.debug("AdvertisementHandler: IGNORE: Store handle in our database so we can use the next advertisement.");
        this.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: advertisement.referenceId, stoneId: referenceByCrownstoneId.id, data:{handle: advertisement.handle}});
        return;
      }
    }

    let referenceByHandle = MapProvider.stoneSphereHandleMap[sphereId][advertisement.handle];

    // unknown crownstone, factory reset it.
    if (referenceByHandle === undefined) {
      this._factoryResetUnknownCrownstone(advertisement.handle);
      return;
    }

    // create an entity for this crownstone if one does not exist yet.
    if (!this.entities[referenceByCrownstoneId.id]) { this.createEntity(sphereId, referenceByCrownstoneId.id); }
    if (!this.entities[referenceByHandle.id])       { this.createEntity(sphereId, referenceByHandle.id);       }

    if (serviceData.stateOfExternalCrownstone === true) {
      let stoneFromServiceData   = state.spheres[advertisement.referenceId].stones[referenceByCrownstoneId.id];
      let stoneFromAdvertisement = state.spheres[advertisement.referenceId].stones[referenceByHandle.id];

      this._resolveMeshNetworkIds(sphereId, stoneFromServiceData, referenceByCrownstoneId.id, stoneFromAdvertisement, referenceByHandle.id);

      this.entities[referenceByCrownstoneId.id].handleContentViaMesh(advertisement);
      this.entities[referenceByHandle.id].handleAdvertisementOfExternalCrownstone(advertisement);

    }
    else {
      this.entities[referenceByCrownstoneId.id].handleDirectAdvertisement(advertisement);
    }
  }

  _resolveMeshNetworkIds(sphereId, stoneFromServiceData, stoneFromServiceDataId, stoneFromAdvertisement, stoneFromAdvertisementId) {
    let meshNetworkId_external   = stoneFromServiceData.config.meshNetworkId;
    let meshNetworkId_advertiser = stoneFromAdvertisement.config.meshNetworkId;

    // initially it does not matter which we select.
    let meshNetworkId = meshNetworkId_advertiser;

    // if these stones are not known to be in a mesh network, they are in the same, new, network.
    if (meshNetworkId_external === null && meshNetworkId_advertiser === null) {
      meshNetworkId = Math.round(Math.random()*1e6).toString(36);
      let actions = [];
      actions.push(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromServiceDataId, meshNetworkId));
      actions.push(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromAdvertisementId, meshNetworkId));
      this.store.batchDispatch(actions);
    }
    // if they are in a different mesh network, place them in the same one.
    else if (meshNetworkId_external !== meshNetworkId_advertiser) {
      if (meshNetworkId_external === null) {
        // copy mesh id from stoneFromAdvertisement to stoneFromServiceData
        meshNetworkId = meshNetworkId_advertiser;
        this.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromServiceDataId, meshNetworkId));
      }
      else if (meshNetworkId_advertiser === null) {
        // copy mesh id from stoneFromServiceData to stoneFromAdvertisement
        meshNetworkId = meshNetworkId_external;
        this.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromAdvertisementId, meshNetworkId));
      }
      else {
        // copy the mesh id from the largest mesh to the smallest mesh
        let state = this.store.getState();
        let stonesInNetwork_external = Util.mesh.getStonesInNetwork(state, sphereId, meshNetworkId_external);
        let stonesInNetwork_advertiser = Util.mesh.getStonesInNetwork(state, sphereId, meshNetworkId_advertiser);

        if (stonesInNetwork_external.length > stonesInNetwork_advertiser.length) {
          meshNetworkId = meshNetworkId_external;
          Util.mesh.setNetworkId(this.store, sphereId, stonesInNetwork_advertiser, meshNetworkId);
        }
        else {
          meshNetworkId = meshNetworkId_external;
          Util.mesh.setNetworkId(this.store, sphereId, stonesInNetwork_external, meshNetworkId);
        }
      }
    }
  }






























  _other() {
    // check if there are any stones left that are not disabled.
    let otherStoneIds = Object.keys(state.spheres[this.sphereId].stones);
    let allDisabled = true;
    otherStoneIds.forEach((otherStoneId) => {
      if (otherStoneId !== this.stoneId) {
        if (state.spheres[this.sphereId].stones[otherStoneId].config.disabled === false) {
          allDisabled = false;
        }
      }
    });

    // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
    if (FALLBACKS_ENABLED) {
      // TODO: find good central decision point for this.
      // if we are in DFU, do not leave the sphere by fallback
      if (DfuStateHandler.areDfuStonesAvailable() !== true) {
        if (allDisabled === true) {
          LOG.info("FALLBACK: StoneStateHandler: FORCE LEAVING SPHERE DUE TO ALL CROWNSTONES BEING DISABLED");
          LocationHandler.exitSphere(sphereId);
        }
      }
      else {
        // reschedule the fallback if we are in dfu.
        this.disabledTimeout = Scheduler.scheduleBackgroundCallback(disableCallback, DISABLE_TIMEOUT, "disable_" + stoneId + "_")
      }
    }
  }



  _factoryResetUnknownCrownstone(handle) {
    if (!this.factoryResettingCrownstones[handle]) {
      this.factoryResettingCrownstones[handle] = true;

      let clearFlag = () => {
        this.factoryResettingCrownstones[handle] = null;
        delete this.factoryResettingCrownstones[handle];
      };

      let details = { from: 'SingleCommand: connecting to ' + handle + ' doing this: commandFactoryReset' };
      BlePromiseManager.registerPriority(
        () => {
          let proxy = BleUtil.getProxy(handle);
          return proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
        }, details)
        .then(() => { clearFlag(); })
        .catch(() => { clearFlag(); })
    }
  }
}

export const StoneManager = new StoneManagerClass();


