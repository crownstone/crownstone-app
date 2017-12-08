
import {
  getMapOfCrownstonesBySphereByHandle, getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle, getMapOfCrownstonesInAllSpheresByIBeacon
} from "../util/DataUtil";
import {eventBus} from "../util/EventBus";
import {getGlobalIdMap} from "../cloud/sections/sync/modelSyncs/SyncingBase";
import {LOG} from "../logging/Log";

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
 *  applianceName: string / undefined
 *  applianceId: string / undefined
 *  locationName: string / undefined
 *  locationId: string / undefined,
 *  cloudIdMap: {
 *    globalIdMap
 *  }
 * }
 *
 */

class MapProviderClass {
  _store : any;
  _initialized : boolean = false;
  stoneSphereHandleMap : any = {};
  stoneHandleMap : any = {};
  stoneCIDMap : any = {};
  stoneIBeaconMap : any = {};
  cloud2localMap : globalIdMap = getGlobalIdMap();
  local2cloudMap : globalIdMap = getGlobalIdMap();

  loadStore(store) {
    if (this._initialized === false) {
      this._store = store;

      eventBus.on("CloudSyncComplete", () => { this._updateCloudIdMap(); });
      eventBus.on("databaseChange", (data) => {
        let change = data.change;

        if (
          change.changeAppliances    ||
          change.changeUsers         ||
          change.changeLocations     ||
          change.changeFingerprint   ||
          change.changeSphereState   ||
          change.changeSpheres       ||
          change.changeSphereUsers   ||
          change.changeStones        ||
          change.changeStoneSchedule ||
          change.changeDeviceData    ||
          change.updateStoneConfig   ||
          change.changeMessage
        ) {
          this.refreshAll();
        }
      });

      this._updateCloudIdMap();
    }
  }

  refreshAll() {
    LOG.info("MapProvider: Refreshing All.");
    let state = this._store.getState();
    this.stoneSphereHandleMap = getMapOfCrownstonesBySphereByHandle(     state);
    this.stoneHandleMap       = getMapOfCrownstonesInAllSpheresByHandle( state);
    this.stoneCIDMap          = getMapOfCrownstonesInAllSpheresByCID(    state);
    this.stoneIBeaconMap      = getMapOfCrownstonesInAllSpheresByIBeacon(state);
    this._updateCloudIdMap();
  }

  _updateCloudIdMap() {
    LOG.info("MapProvider: Refreshing CloudIdMap.");
    let state = this._store.getState();
    this.cloud2localMap = getGlobalIdMap();
    this.local2cloudMap = getGlobalIdMap();

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

    let getFromConfig = (source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return item.config.cloudId; }, cloud2local, local2cloud);
    };
    let getFromId = (source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return localId; }, cloud2local, local2cloud);
    };
    let getFromItem = (source, cloud2local, local2cloud) => {
      fillMaps(source, (item, localId) => { return item.cloudId; }, cloud2local, local2cloud);
    };

    getFromConfig(state.spheres, this.cloud2localMap.spheres, this.local2cloudMap.spheres);
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      getFromConfig(sphere.messages,    this.cloud2localMap.messages,   this.local2cloudMap.messages);
      getFromConfig(sphere.appliances,  this.cloud2localMap.appliances, this.local2cloudMap.appliances);
      getFromConfig(sphere.locations,   this.cloud2localMap.locations,  this.local2cloudMap.locations);
      getFromConfig(sphere.stones,      this.cloud2localMap.stones,     this.local2cloudMap.stones);

      getFromId(sphere.users,         this.cloud2localMap.users,      this.local2cloudMap.users);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        let stone = sphere.stones[stoneId];
        getFromItem(stone.schedules, this.cloud2localMap.schedules, this.local2cloudMap.schedules);
      })

    });
  }
}


export const MapProvider = new MapProviderClass();