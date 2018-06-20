import { eventBus }               from "../../util/EventBus";
import {DISABLE_TIMEOUT, FALLBACKS_ENABLED} from "../../ExternalConfig";
import { LOGd, LOGi, LOGv, LOGw } from "../../logging/Log";
import { NativeBus }              from "../libInterface/NativeBus";
import { MapProvider }            from "../../backgroundProcesses/MapProvider";
import { BlePromiseManager }      from "../../logic/BlePromiseManager";
import { BleUtil }                from "../../util/BleUtil";
import { BluenetPromiseWrapper }  from "../libInterface/BluenetPromise";
import { Scheduler }              from "../../logic/Scheduler";
import { Util }                   from "../../util/Util";
import { StoneEntity }            from "./StoneEntity";
import { LocationHandler }        from "../localization/LocationHandler";
import { DfuStateHandler }        from "../firmware/DfuStateHandler";
import { StoneStoreManager }      from "./StoneStoreManager";


/**
 * The Stone Manager receives all updates from advertisements and ibeacons
 * It dispatches these to the appropriate StoneEntities
 *
 * Entities are created and removed as required
 */
class StoneManagerClass {

  store;
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
  //   eventBus.on("ADVERTISEMENT_DEBUGGING", (state) => {
  //     this._debug(state);
  //   })
  // }

  loadStore(store) {
    if (this._initialized === false) {
      LOGi.native("StoreManager: loadStore");
      this.store = store;
      this.storeManager = new StoneStoreManager(store);
      this._init();
    }
  }

  // _debug(debugState) {
  //   if (debugState) {
  //     if (!this._debugging) {
  //       this._debugging = true;
  //       let state = this.store.getState();
  //       let sphereIds = Object.keys(state.spheres);
  //       sphereIds.forEach((sphereId) => {
  //         let stoneIds = Object.keys(state.spheres[sphereId].stones);
  //         stoneIds.forEach((stoneId) => {
  //           this.createEntity(sphereId, stoneId);
  //         })
  //       })
  //       eventBus.emit("ADVERTISEMENT_DEBUGGING", true);
  //     }
  //   }
  // }


  _init() {
    if (this._initialized === false) {
      // make sure we clear any pending advertisement package updates that are scheduled for this crownstone
      eventBus.on("connecting", (handle) => {
        // this is a fallback mechanism in case no disconnect event is fired.
        this.stonesInConnectionProcess[handle] = { timeout: Scheduler.scheduleCallback(() => {
            LOGw.native("(Ignore if doing setup) Force restoring listening to all crownstones since no disconnect state after 15 seconds.");
            this._restoreConnectionTimeout();
          }, 15000, 'ignoreProcessAdvertisementsTimeout')};
      });
      // sometimes the first event since state change can be wrong, we use this to ignore it.
      eventBus.on("disconnect", () => {
        // wait before listening to the stones again.
        Scheduler.scheduleCallback(() => { this._restoreConnectionTimeout(); }, 1000,'_restoreConnectionTimeout');
      });


      // clean entities if we remove a stone or a sphere
      eventBus.on("databaseChange", (data) => {
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

      eventBus.on("CrownstoneDisabled", (sphereId) => { this._evaluateDisabledState(sphereId); });

      // // if we are syncing, this means we might get new crownstones to download, in the mean time we dont want to factory reset them
      // eventBus.on("CloudSyncStarting", () => { this._pauseFactoryResetCapability();   });
      // // after syncing we enable factory reset capability
      // eventBus.on("CloudSyncComplete", () => { this._restoreFactoryResetCapability(); });
      //
      // // during setup we do will ignore crownstones which we can understand but dont have in the database
      // eventBus.on("setupStarted"  , (stoneHandle) => { this._pauseFactoryResetCapability();   });
      //
      // // we will delay the enabling of the automatic factory resetting to ensure setup mode has really been concluded.
      // eventBus.on("setupCancelled", (stoneHandle) => { this._restoreFactoryResetCapability(); });
      // eventBus.on("setupComplete" , (stoneHandle) => { this._restoreFactoryResetCapability(); });

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

  // _pauseFactoryResetCapability() {
  //   // make sure we do not factory reset unknown crownstones.
  //   if (this.factoryResetUnknownStonesEnableTimeout !== null) {
  //     this.factoryResetUnknownStonesEnableTimeout();
  //     this.factoryResetUnknownStonesEnableTimeout = null;
  //   }
  //   this.factoryResetUnknownStonesEnabled = false;
  // }
  //
  // _restoreFactoryResetCapability() {
  //   if (this.factoryResetUnknownStonesEnableTimeout !== null) {
  //     this.factoryResetUnknownStonesEnableTimeout();
  //   }
  //   this.factoryResetUnknownStonesEnableTimeout = Scheduler.scheduleCallback(() => {
  //     this.factoryResetUnknownStonesEnableTimeout = null;
  //     this.factoryResetUnknownStonesEnabled = true;
  //   }, 5000, "Restore factory reset capabilities.")
  // }


  _restoreConnectionTimeout() {
    Object.keys(this.stonesInConnectionProcess).forEach((handle) => {
      if (typeof this.stonesInConnectionProcess[handle].timeout === 'function') {
        this.stonesInConnectionProcess[handle].timeout();
      }
    });
    this.stonesInConnectionProcess = {};
  }


  createEntity(sphereId, stoneId) {
    this.entities[stoneId] = new StoneEntity(this.store, this.storeManager, sphereId, stoneId);

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
    let state = this.store.getState();
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

    eventBus.emit("iBeaconOfValidCrownstone", {stoneId: stoneId, rssi: ibeaconPackage.rssi});

    // create an entity for this crownstone if one does not exist yet.
    if (!this.entities[stoneId]) { this.createEntity(sphereId, stoneId); }

    LOGv.native("StoneManager.handleIbeacon: propagating to entity.");
    this.entities[stoneId].ibeaconUpdate(ibeaconPackage);
  }


  handleAdvertisement(advertisement : crownstoneAdvertisement) {
    LOGd.native("StoneManager: Handling Advertisement");

    // the service data in this advertisement;
    let serviceData : crownstoneServiceData = advertisement.serviceData;
    let state = this.store.getState();

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
      return;;
    }

    // repair mechanism to store the handle.
    if (serviceData.stateOfExternalCrownstone === false && referenceByCrownstoneId !== undefined) {
      if (referenceByCrownstoneId.handle != advertisement.handle) {
        LOGd.native("StoneManager: IGNORE: Store handle in our database so we can use the next advertisement.");
        this.store.dispatch({type: "UPDATE_STONE_HANDLE", sphereId: advertisement.referenceId, stoneId: referenceByCrownstoneId.id, data:{handle: advertisement.handle}});
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
      eventBus.emit("AdvertisementOfValidCrownstone", {stoneId: referenceByHandle.id, rssi: advertisement.rssi})
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
      this.entities[referenceByCrownstoneId.id].handleDirectAdvertisement(stoneFromAdvertisement, advertisement);
    }
  }


  /**
   * This is a suggestion for the cases where you can decypher an advertisement but you don't know this Crownstone.
   * Currently unused.
   * @param handle
   * @private
   */
  // _factoryResetUnknownCrownstone(handle) {
  //   if (this.factoryResetUnknownStonesEnabled === false) { return; }
  //
  //   if (!this.factoryResettingCrownstones[handle]) {
  //     this.factoryResettingCrownstones[handle] = true;
  //
  //     let clearFlag = () => {
  //       this.factoryResettingCrownstones[handle] = null;
  //       delete this.factoryResettingCrownstones[handle];
  //     };
  //
  //     let details = { from: 'DirectCommand: connecting to ' + handle + ' doing this: commandFactoryReset' };
  //     BlePromiseManager.registerPriority(
  //       () => {
  //         let proxy = BleUtil.getProxy(handle);
  //         return proxy.performPriority(BluenetPromiseWrapper.commandFactoryReset)
  //       }, details )
  //       .then( () => { clearFlag(); })
  //       .catch(() => { clearFlag(); })
  //   }
  // }


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
      this.store.batchDispatch(actions);
    }
    // if they are in a different mesh network, place them in the same one.
    else if (meshNetworkId_external !== meshNetworkId_advertiser) {
      LOGi.mesh("StoneManager: Updating mesh networks!");
      if (meshNetworkId_external === null) {
        // copy mesh id from stoneFromAdvertisement to stoneFromServiceData
        meshNetworkId = meshNetworkId_advertiser;
        LOGi.mesh("StoneManager: Adding Stone to existing mesh network", stoneFromServiceDataId, meshNetworkId);
        this.store.dispatch(Util.mesh.getChangeMeshIdAction(sphereId, stoneFromServiceDataId, meshNetworkId));
      }
      else if (meshNetworkId_advertiser === null) {
        // copy mesh id from stoneFromServiceData to stoneFromAdvertisement
        meshNetworkId = meshNetworkId_external;
        LOGi.mesh("StoneManager: Adding Stone to existing mesh network", stoneFromAdvertisementId, meshNetworkId);
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
          meshNetworkId = meshNetworkId_advertiser;
          Util.mesh.setNetworkId(this.store, sphereId, stonesInNetwork_external, meshNetworkId);
        }
        LOGi.mesh("StoneManager: Merging networks:", meshNetworkId_advertiser, meshNetworkId_external, " into ", meshNetworkId);
      }
    }
  }


  _evaluateDisabledState(sphereId) {
    let state = this.store.getState();
    // check if there are any stones left that are not disabled.
    let stoneIds = Object.keys(state.spheres[sphereId].stones);
    let allDisabled = true;
    stoneIds.forEach((stoneId) => {
      if (state.spheres[sphereId].stones[stoneId].config.disabled === false) {
        allDisabled = false;
      }
    });

    // fallback to ensure we never miss an enter or exit event caused by a bug in ios 10
    if (FALLBACKS_ENABLED) {
      // if we are in DFU, do not leave the sphere by fallback
      if (DfuStateHandler.areDfuStonesAvailable() !== true) {
        if (allDisabled === true) {
          LOGi.info("FALLBACK: StoneStateHandler: FORCE LEAVING SPHERE DUE TO ALL CROWNSTONES BEING DISABLED");
          LocationHandler.exitSphere(sphereId);
        }
      }
      else {
        // reschedule the fallback if we are in dfu.
        Scheduler.scheduleBackgroundCallback(() => { this._evaluateDisabledState(sphereId); }, DISABLE_TIMEOUT, "disable")
      }
    }
  }
}

export const StoneManager = new StoneManagerClass();


