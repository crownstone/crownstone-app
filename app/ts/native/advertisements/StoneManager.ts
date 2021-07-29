import { LOGd, LOGi, LOGv, LOGw } from "../../logging/Log";
import { MapProvider }            from "../../backgroundProcesses/MapProvider";
import { Scheduler }              from "../../logic/Scheduler";
import { Util }                   from "../../util/Util";
import { StoneEntity }            from "./StoneEntity";
import { StoneStoreManager }      from "./StoneStoreManager";
import { core } from "../../Core";


/**
 * The Stone Manager receives all updates from advertisements and ibeacons
 * It dispatches these to the appropriate StoneEntities
 *
 * Entities are created and removed as required
 */
class StoneManagerClass {

  storeManager;
  _initialized = false;
  stonesInConnectionProcess : any = {};

  entities = {};
  sphereEntityCollections = {};

  // factoryResettingCrownstones : any = {};
  // factoryResetUnknownStonesEnabled = false;
  // factoryResetUnknownStonesEnableTimeout = null;

  // _debugging = false
  //
  // constructor() {
  //   core.eventBus.on("ADVERTISEMENT_DEBUGGING", (state) => {
  //     this._debug(state);
  //   })
  // }


  // _debug(debugState) {
  //   if (debugState) {
  //     if (!this._debugging) {
  //       this._debugging = true;
  //       let state = core.store.getState();
  //       let sphereIds = Object.keys(state.spheres);
  //       sphereIds.forEach((sphereId) => {
  //         let stoneIds = Object.keys(state.spheres[sphereId].stones);
  //         stoneIds.forEach((stoneId) => {
  //           this.createEntity(sphereId, stoneId);
  //         })
  //       })
  //       core.eventBus.emit("ADVERTISEMENT_DEBUGGING", true);
  //     }
  //   }
  // }


  init() {
    if (this._initialized === false) {
      this.storeManager = new StoneStoreManager();

      // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
      core.eventBus.on("connecting", (handle) => {
        // this is a fallback mechanism in case no disconnect event is fired.
        this.stonesInConnectionProcess[handle] = {
          timeout: Scheduler.scheduleCallback(() => {
            LOGw.native("(Ignore if doing setup) Force restoring listening to all crownstones since no disconnect state after 15 seconds.");
            this._restoreConnectionTimeout();
          }, 15000, 'ignoreProcessAdvertisementsTimeout')};
      });
      // sometimes the first event since state change can be wrong, we use this to ignore it.
      core.eventBus.on("disconnect", () => {
        // wait before listening to the stones again.
        Scheduler.scheduleCallback(() => { this._restoreConnectionTimeout(); }, 1000,'_restoreConnectionTimeout');
      });


      // clean entities if we remove a stone or a sphere
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;
        let changedAction = change.removeStone || change.removeSphere;
        if (changedAction) {
          let sphereIds = Object.keys(changedAction.sphereIds);
          sphereIds.forEach((sphereId) => {
            if (this.sphereEntityCollections[sphereId]) {
              let stoneIds = Object.keys(this.sphereEntityCollections[sphereId]);
              stoneIds.forEach((stoneId) => {
                if (this.sphereEntityCollections[sphereId][stoneId]) {
                  this.removeEntity(sphereId, stoneId);
                }
              });
            }
          });
        }
      });


      // listen to verified advertisements. Verified means consecutively successfully encrypted.
      core.nativeBus.on(core.nativeBus.topics.advertisement, this.handleAdvertisement.bind(this));

      core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data : ibeaconPackage[]) => {
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
      }
    });
    this.stonesInConnectionProcess = {};
  }


  createEntity(sphereId, stoneId) {
    this.entities[stoneId] = new StoneEntity(core.store, this.storeManager, sphereId, stoneId);

    if (!this.sphereEntityCollections[sphereId]) {
      this.sphereEntityCollections[sphereId] = {};
    }

    this.sphereEntityCollections[sphereId][stoneId] = true;
  }


  removeEntity(sphereId, stoneId) {
    this.entities[stoneId].destroy();
    delete this.entities[stoneId];
    this.sphereEntityCollections[sphereId][stoneId] = false;
    delete this.sphereEntityCollections[sphereId][stoneId];
  }


  handleIBeacon(ibeaconPackage : ibeaconPackage) {
    LOGd.native("StoneManager: Handling iBeacon");

    let sphereId = ibeaconPackage.referenceId;

    // only use valid rssi measurements, 0 or 128 are not valid measurements
    if (ibeaconPackage.rssi === undefined || ibeaconPackage.rssi > -1) {
      LOGd.native("StoneManager.handleIbeacon: IGNORE: no rssi.");
      return;
    }

    if (sphereId === undefined || ibeaconPackage.major  === undefined || ibeaconPackage.minor === undefined) {
      LOGd.native("StoneManager.handleIbeacon: IGNORE: no sphereId or no major or no minor.");
      return;
    }

    // check if we have the sphere
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    if (!(sphere)) {
      LOGd.native("StoneManager.handleIbeacon: IGNORE: unknown sphere.");
      return;
    }


    // check if we have a stone with this major / minor
    let ibeaconString = ibeaconPackage.uuid + '_' + ibeaconPackage.major + '_' + ibeaconPackage.minor;
    let stoneData = MapProvider.stoneIBeaconMap[ibeaconString.toLowerCase()];
    if (!(stoneData)) {
      LOGd.native("StoneManager.handleIbeacon: IGNORE: unknown stone.");
      return;
    }

    let stoneId = stoneData.id;

    core.eventBus.emit("iBeaconOfValidCrownstone", {stoneId: stoneId, handle: stoneData.handle, rssi: ibeaconPackage.rssi, sphereId: sphereId});

    // create an entity for this crownstone if one does not exist yet.
    if (!this.entities[stoneId]) { this.createEntity(sphereId, stoneId); }

    LOGv.native("StoneManager.handleIbeacon: propagating to entity.");
    this.entities[stoneId].ibeaconUpdate(ibeaconPackage);
  }


  handleAdvertisement(advertisement : crownstoneAdvertisement) {
    LOGd.native("StoneManager: Handling Advertisement");

    // the service data in this advertisement;
    let serviceData : crownstoneServiceData = advertisement.serviceData;
    let state = core.store.getState();

    // service data not available
    if (typeof serviceData !== 'object') {
      LOGd.native("StoneManager: IGNORE: serviceData is not an object.");
      return;
    }

    // check if we have a state
    if (state.spheres === undefined) {
      LOGd.native("StoneManager: IGNORE: We have no spheres.");
      return;
    }

    // only relevant if we are in a sphere.
    if (state.spheres[advertisement.referenceId] === undefined) {
      LOGd.native("StoneManager: IGNORE: This specific sphere is unknown to us.");
      return;
    }

    if (serviceData.alternativeState === true) {
      // ignore the alternative state for now.
      return;
    }

    // this is the referenceId of the spherekeys that we used to decrypt this advertisement
    let sphereId = advertisement.referenceId;

    // look for the crownstone in this sphere which has the same CrownstoneId (CID)
    let referenceByCrownstoneId = MapProvider.stoneCIDMap[sphereId][serviceData.crownstoneId];

    // check if we have a Crownstone with this CID, if not, ignore it.
    if (referenceByCrownstoneId === undefined) {
      // unknown crownstone, factory reset it.
      LOGd.native("StoneManager: IGNORE: unknown Crownstone Id.");
      // LOGw.native("StoneManager: ATTEMPTING FACTORY RESET OF UNKNOWN CROWNSTONE");
      // this._factoryResetUnknownCrownstone(advertisement.handle);
      return;
    }

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && referenceByCrownstoneId !== undefined) {
      if (referenceByCrownstoneId.handle != advertisement.handle) {
        LOGw.native("StoneManager: IGNORE: Store handle in our database so we can use the next advertisement.");
        core.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: advertisement.referenceId, stoneId: referenceByCrownstoneId.id, data:{handle: advertisement.handle}});
        return;
      }
    }

    let referenceByHandle = MapProvider.stoneSphereHandleMap[sphereId][advertisement.handle];
    if (!referenceByHandle) {
      // unknown crownstone, factory reset it.
      LOGw.native("StoneManager: IGNORE: UNKNOWN REFERENCE BY HANDLE");
      // LOGw.native("StoneManager: ATTEMPTING FACTORY RESET OF UNKNOWN CROWNSTONE");
      // this._factoryResetUnknownCrownstone(advertisement.handle);
      return;
    }

    // emit event of valid crownstone
    if (advertisement.rssi && advertisement.rssi < 0) {
      core.eventBus.emit("AdvertisementOfValidCrownstone", {stoneId: referenceByHandle.id, rssi: advertisement.rssi, handle: advertisement.handle, payloadId: referenceByCrownstoneId.id, sphereId: advertisement.referenceId})
    }

    // this is on manager level, not on entity level since setup crownstones do not have an entity but do need this functionality.
    if (this.stonesInConnectionProcess[advertisement.handle] !== undefined) {
      LOGd.native("StoneManager: IGNORE: connecting to stone.");
      return;
    }

    // create an entity for this crownstone if one does not exist yet.
    if (!this.entities[referenceByCrownstoneId.id]) { this.createEntity(sphereId, referenceByCrownstoneId.id); }
    if (!this.entities[referenceByHandle.id])       { this.createEntity(sphereId, referenceByHandle.id);       }

    let stoneFromServiceData   = state.spheres[advertisement.referenceId].stones[referenceByCrownstoneId.id];
    let stoneFromAdvertisement = state.spheres[advertisement.referenceId].stones[referenceByHandle.id];

    if (serviceData.stateOfExternalCrownstone === true) {
      this._resolveMeshNetworkIds(sphereId, stoneFromServiceData, referenceByCrownstoneId.id, stoneFromAdvertisement, referenceByHandle.id);

      this.entities[referenceByCrownstoneId.id].handleContentViaMesh(stoneFromServiceData, advertisement);
      this.entities[referenceByHandle.id].handleAdvertisementOfExternalCrownstone(advertisement.referenceId, stoneFromAdvertisement, referenceByCrownstoneId.id, stoneFromServiceData, advertisement);
    }
    else {
      let smartHomeState = state.spheres[sphereId].state.smartHomeEnabled;
      if (
        advertisement.serviceData.behaviourEnabled !== null &&
        advertisement.serviceData.behaviourEnabled !== undefined &&
        advertisement.serviceData.behaviourEnabled !== smartHomeState
      ) {
        core.eventBus.emit(sphereId + "_smartHomeState", smartHomeState);
      }

      this.entities[referenceByCrownstoneId.id].handleDirectAdvertisement(stoneFromAdvertisement, advertisement);
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
      LOGi.mesh("StoneManager: Found new mesh network:", meshNetworkId);
      let actions = [];
      actions.push(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromServiceDataId, meshNetworkId));
      actions.push(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromAdvertisementId, meshNetworkId));
      core.store.batchDispatch(actions);
    }
    // if they are in a different mesh network, place them in the same one.
    else if (meshNetworkId_external !== meshNetworkId_advertiser) {
      LOGi.mesh("StoneManager: Updating mesh networks!");
      if (meshNetworkId_external === null) {
        // copy mesh id from stoneFromAdvertisement to stoneFromServiceData
        meshNetworkId = meshNetworkId_advertiser;
        LOGi.mesh("StoneManager: Adding Stone to existing mesh network", stoneFromServiceDataId, meshNetworkId);
        core.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromServiceDataId, meshNetworkId));
      }
      else if (meshNetworkId_advertiser === null) {
        // copy mesh id from stoneFromServiceData to stoneFromAdvertisement
        meshNetworkId = meshNetworkId_external;
        LOGi.mesh("StoneManager: Adding Stone to existing mesh network", stoneFromAdvertisementId, meshNetworkId);
        core.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromAdvertisementId, meshNetworkId));
      }
      else {
        // copy the mesh id from the largest mesh to the smallest mesh
        let state = core.store.getState();
        let stonesInNetwork_external = Util.mesh.getStonesInNetwork(state, sphereId, meshNetworkId_external);
        let stonesInNetwork_advertiser = Util.mesh.getStonesInNetwork(state, sphereId, meshNetworkId_advertiser);

        if (stonesInNetwork_external.length > stonesInNetwork_advertiser.length) {
          meshNetworkId = meshNetworkId_external;
          Util.mesh.setNetworkId(core.store, sphereId, stonesInNetwork_advertiser, meshNetworkId);
        }
        else {
          meshNetworkId = meshNetworkId_advertiser;
          Util.mesh.setNetworkId(core.store, sphereId, stonesInNetwork_external, meshNetworkId);
        }
        LOGi.mesh("StoneManager: Merging networks:", meshNetworkId_advertiser, meshNetworkId_external, " into ", meshNetworkId);
      }
    }
  }
}

export const StoneManager = new StoneManagerClass();


