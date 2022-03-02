
import {
  getMapOfCrownstonesBySphereByHandle,
  getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle,
  getMapOfCrownstonesInAllSpheresByIBeacon,
  getMapOfCrownstonesInAllSpheresByStoneId
} from "../util/MapUtil";
import { getSyncIdMap } from "../cloud/sections/sync/modelSyncs/SyncingBase";
import { LOG, LOGi} from "../logging/Log";
import { core } from "../Core";

/**
 * Map format
 *
 * stoneCIDMap = {sphereId: {crownstoneId: {map}}}
 * stoneSphereHandleMap = {sphereId: {handle: {map}}}
 * stoneHandleMap = {handle: {map}}}
 * stoneIBeaconMap = { (ibeaconUUID + '_' + major + '_' + minor) : {map}}}
 *
 * map = {
 *  id: stoneId, // redux database id
 *  cid: number,
 *  handle: string,
 *  name: string,
 *  sphereId: string,
 *  locationName: string / undefined
 *  locationId: string / undefined,
 * }
 *
 */


class MapProviderClass {
  _initialized : boolean = false;
  stoneSphereHandleMap : StoneSphereHandleMap = {};
  stoneHandleMap  : StoneHandleMap = {};
  stoneSummaryMap : StoneSummaryMap = {};
  stoneCIDMap     : StoneCIDMap = {};
  locationUIDMap  : locationUIDMap = {};
  stoneIBeaconMap : StoneIBeaconMap = {};
  cloud2localMap  : syncIdMap = getSyncIdMap();
  local2cloudMap  : syncIdMap = getSyncIdMap();
  cloudIdMap      : Record<string, any> = {};

  init() {
    if (this._initialized === false) {
      core.eventBus.on("CloudSyncComplete", () => { this._updateCloudIdMap(); });
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;

        if (
          change.userLogin             ||
          change.changeUsers           ||
          change.changeLocations       ||
          change.changeFingerprint     ||
          change.changeSphereState     ||
          change.changeSpheres         ||
          change.changeSphereUsers     ||
          change.stoneChangeBehaviours ||
          change.changeLocations       ||
          change.changeStones          ||
          change.changeHubs            ||
          change.changeScenes          ||
          change.changeStoneHandle     ||
          change.changeDeviceData      ||
          change.updatedToon           ||
          change.updatedCloudIds       ||
          change.updateStoneConfig     ||
          change.changeMessage
        ) {
          this.refreshAll();
        }

        if (change.changeStones) {
          this.logMap()
        }

      });

      this.refreshAll();
      this.logMap();
    }
  }

  reset() {
    this.stoneSphereHandleMap = {}
    this.stoneHandleMap       = {}
    this.stoneSummaryMap      = {}
    this.stoneCIDMap          = {}
    this.locationUIDMap       = {}
    this.stoneIBeaconMap      = {}
    this.cloudIdMap           = {}
    this.cloud2localMap       = getSyncIdMap();
    this.local2cloudMap       = getSyncIdMap();
  }


  refreshAll() {
    LOG.info("MapProvider: Refreshing All.");
    let state = core.store.getState();

    this.stoneSphereHandleMap = getMapOfCrownstonesBySphereByHandle(     state);
    this.stoneHandleMap       = getMapOfCrownstonesInAllSpheresByHandle( state);
    this.stoneSummaryMap      = getMapOfCrownstonesInAllSpheresByStoneId(state);
    this.stoneCIDMap          = getMapOfCrownstonesInAllSpheresByCID(    state);
    this.locationUIDMap       = this.getLocationUIDMap(                  state);
    this.stoneIBeaconMap      = getMapOfCrownstonesInAllSpheresByIBeacon(state);
    this._updateCloudIdMap();
  }

  getLocationUIDMap(state) {
    let sphereIds = Object.keys(state.spheres);
    let uidMap : locationUIDMap = {}
    sphereIds.forEach((sphereId) => {
      uidMap[sphereId] = {};
      let locations = state.spheres[sphereId].locations;
      let locationIds = Object.keys(locations);
      locationIds.forEach((locationId) => {
        let location = locations[locationId];
        uidMap[sphereId][location.config.uid] = {
          id: locationId, // redux database id
          uid: location.config.uid,
          name: location.config.name,
          icon: location.config.icon,
        }
      })
    });

    return uidMap;
  }


  logMap() {
    let state = core.store.getState();
    let stoneIdMap = {};
    let stoneHandleMap = {};
    let locationIdMap = {};
    let sphereIdMap = {};

    for (let sphereId in state.spheres) {
      let sphere : SphereData = state.spheres[sphereId];
      sphereIdMap[sphereId] = {name: sphere.config.name, uuid: sphere.config.iBeaconUUID, cloudId: sphere.config.cloudId, uid: sphere.config.uid};
      for (let locationId in sphere.locations) {
        let location = sphere.locations[locationId]
        locationIdMap[locationId] = {uid: location.config.uid, name: location.config.name, cloudId: location.config.cloudId}
      }
      for (let stoneId in sphere.stones) {
        let stone = sphere.stones[stoneId];
        stoneIdMap[stoneId] = {uid: stone.config.uid, handle:stone.config.handle, name: stone.config.name, locationId: stone.config.locationId, cloudId: stone.config.cloudId};
        stoneHandleMap[stone.config.handle] = stoneId;
      }
    }

    LOGi.info("MapProvider: nameMap", JSON.stringify({sphereIdMap, locationIdMap, stoneIdMap, stoneHandleMap}))
  }


  _updateCloudIdMap() {
    LOG.info("MapProvider: Refreshing CloudIdMap.");
    let state = core.store.getState();
    this.cloud2localMap = getSyncIdMap();
    this.local2cloudMap = getSyncIdMap();
    this.cloudIdMap = {};

    let fillMaps = (source, getCloudIdFromItem, cloud2local, local2cloud) => {
      let sourceIds = Object.keys(source);
      sourceIds.forEach((sourceId) => {
        let cloudId = getCloudIdFromItem(source[sourceId], sourceId);
        if (cloudId) {
          cloud2local[cloudId] = sourceId;
          local2cloud[sourceId] = cloudId;
        }
      })
    };

    let getFromConfig = (sphereId, source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return item.config.cloudId; }, cloud2local, local2cloud);
    };
    let getFromIdPerSphere = (sphereId, source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return sphereId + localId; }, cloud2local, local2cloud);
    };
    let getFromItem = (sphereId, source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return item.cloudId; }, cloud2local, local2cloud);
    };

    getFromConfig(null, state.spheres, this.cloud2localMap.spheres, this.local2cloudMap.spheres);
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      getFromConfig( sphereId, sphere.messages,         this.cloud2localMap.messages,   this.local2cloudMap.messages);
      getFromConfig( sphereId, sphere.locations,        this.cloud2localMap.locations,  this.local2cloudMap.locations);
      getFromConfig( sphereId, sphere.stones,           this.cloud2localMap.stones,     this.local2cloudMap.stones);
      getFromConfig( sphereId, sphere.hubs,             this.cloud2localMap.hubs,       this.local2cloudMap.hubs);
      getFromItem(   sphereId, sphere.scenes,           this.cloud2localMap.scenes,     this.local2cloudMap.scenes);
      getFromItem(   sphereId, sphere.thirdParty.toons, this.cloud2localMap.toons,      this.local2cloudMap.toons);
      getFromIdPerSphere(sphereId, sphere.users,        this.cloud2localMap.users,      this.local2cloudMap.users);


      Object.keys(sphere.stones).forEach((stoneId) => {
        getFromItem(sphereId, sphere.stones[stoneId].behaviours, this.cloud2localMap.behaviours, this.local2cloudMap.behaviours);
        getFromItem(sphereId, sphere.stones[stoneId].abilities,  this.cloud2localMap.abilities,  this.local2cloudMap.abilities);
        Object.keys(sphere.stones[stoneId].abilities).forEach((abilityId) => {
          getFromItem(sphereId, sphere.stones[stoneId].abilities[abilityId].properties, this.cloud2localMap.abilityProperties, this.local2cloudMap.abilityProperties);
        })
      })
    });


    // this will be used to check if newly created things from syncV2 are conflicting with existing items.
    for (let item in this.cloud2localMap) {
      for (let id in this.cloud2localMap[item]) {
        this.cloudIdMap[id] = {item, localId: this.cloud2localMap[item][id]};
      }
    }
  }
}


export const MapProvider = new MapProviderClass();