
import {
  getMapOfCrownstonesBySphereByHandle, getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle
} from "../util/DataUtil";
import {eventBus} from "../util/EventBus";
import {getGlobalIdMap} from "../cloud/sections/sync/modelSyncs/SyncingBase";

/**
 * Map format
 *
 * stoneCIDMap = {sphereId: {crownstoneId: {map}}}
 * stoneSphereHandleMap = {sphereId: {handle: {map}}}
 * stoneHandleMap = {handle: {map}}}
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
  state : any = {};
  cloud2localMap : globalIdMap = getGlobalIdMap();
  local2cloudMap : globalIdMap = getGlobalIdMap();

  _loadStore(store) {
    if (this._initialized === false) {
      this._store = store;

      // refresh maps when the database changes
      this._store.subscribe(() => {
        this.state = this._store.getState();
        this.stoneSphereHandleMap = getMapOfCrownstonesBySphereByHandle(    this.state);
        this.stoneHandleMap       = getMapOfCrownstonesInAllSpheresByHandle(this.state);
        this.stoneCIDMap          = getMapOfCrownstonesInAllSpheresByCID(   this.state);
      });

      eventBus.on("CloudSyncComplete", () => { this._updateCloudIdMap(); });

      this._updateCloudIdMap();
    }
  }

  _updateCloudIdMap() {
    let state = this._store.getState();
    this.cloud2localMap = getGlobalIdMap();
    this.local2cloudMap = getGlobalIdMap();

    let fillMaps = (source, getCloudIdFromItem, cloud2local, local2cloud) => {
      let sourceIds = Object.keys(source);
      sourceIds.forEach((sourceId) => {
        let cloudId = getCloudIdFromItem(source[sourceId]);
        if (cloudId) {
          cloud2local[cloudId] = sourceId;
          local2cloud[sourceId] = cloudId;
        }
      })
    };

    let getFromConfig = (source, cloud2local, local2cloud) => {
      fillMaps(source, (item) => { return item.config.cloudId; }, cloud2local, local2cloud);
    };

    let getFromItem = (source, cloud2local, local2cloud) => {
      fillMaps(source, (item) => { return item.cloudId; }, cloud2local, local2cloud);
    };

    getFromConfig(state.spheres, this.cloud2localMap.spheres, this.local2cloudMap.spheres);
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      getFromConfig(sphere.messages,    this.cloud2localMap.messages,   this.local2cloudMap.messages);
      getFromConfig(sphere.appliances,  this.cloud2localMap.appliances, this.local2cloudMap.appliances);
      getFromConfig(sphere.locations,   this.cloud2localMap.locations,  this.local2cloudMap.locations);
      getFromConfig(sphere.stones,      this.cloud2localMap.stones,     this.local2cloudMap.stones);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        let stone = sphere.stones[stoneId];
        getFromItem(stone.schedules, this.cloud2localMap.schedules, this.local2cloudMap.schedules);
      })

    });
  }
}


export const MapProvider = new MapProviderClass();