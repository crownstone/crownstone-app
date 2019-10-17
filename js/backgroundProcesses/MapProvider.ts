
import {
  getMapOfCrownstonesBySphereByHandle,
  getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle,
  getMapOfCrownstonesInAllSpheresByIBeacon,
  getMapOfCrownstonesInAllSpheresByStoneId
} from "../util/DataUtil";
import {getGlobalIdMap} from "../cloud/sections/sync/modelSyncs/SyncingBase";
import {LOG} from "../logging/Log";
import { core } from "../core";

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
  stoneIBeaconMap : StoneIBeaconMap = {};
  cloud2localMap  : globalIdMap = getGlobalIdMap();
  local2cloudMap  : globalIdMap = getGlobalIdMap();

  init() {
    if (this._initialized === false) {
      core.eventBus.on("CloudSyncComplete", () => { this._updateCloudIdMap(); });
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;

        if (
          change.changeUsers         ||
          change.changeLocations     ||
          change.changeFingerprint   ||
          change.changeSphereState   ||
          change.changeSpheres       ||
          change.changeSphereUsers   ||
          change.changeStones        ||
          change.changeStoneHandle   ||
          change.changeDeviceData    ||
          change.updatedToon         ||
          change.updatedCloudIds     ||
          change.updateStoneConfig   ||
          change.changeMessage
        ) {
          this.refreshAll();
        }
      });

      this.refreshAll();
    }
  }


  refreshAll() {
    LOG.info("MapProvider: Refreshing All.");
    let state = core.store.getState();

    this.stoneSphereHandleMap = getMapOfCrownstonesBySphereByHandle(     state);
    this.stoneHandleMap       = getMapOfCrownstonesInAllSpheresByHandle( state);
    this.stoneSummaryMap      = getMapOfCrownstonesInAllSpheresByStoneId(state);
    this.stoneCIDMap          = getMapOfCrownstonesInAllSpheresByCID(    state);
    this.stoneIBeaconMap      = getMapOfCrownstonesInAllSpheresByIBeacon(state);
    this._updateCloudIdMap();
  }

  _updateCloudIdMap() {
    LOG.info("MapProvider: Refreshing CloudIdMap.");
    let state = core.store.getState();
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
      getFromConfig(sphere.messages,         this.cloud2localMap.messages,   this.local2cloudMap.messages);
      getFromConfig(sphere.locations,        this.cloud2localMap.locations,  this.local2cloudMap.locations);
      getFromConfig(sphere.stones,           this.cloud2localMap.stones,     this.local2cloudMap.stones);
      getFromItem(sphere.thirdParty.toons,   this.cloud2localMap.toons,      this.local2cloudMap.toons);
      getFromId(sphere.users,                this.cloud2localMap.users,      this.local2cloudMap.users);

      Object.keys(sphere.stones).forEach((stoneId) => {
        getFromItem(sphere.stones[stoneId].rules,   this.cloud2localMap.behaviour,      this.local2cloudMap.behaviour);
      })
    });
  }
}


export const MapProvider = new MapProviderClass();