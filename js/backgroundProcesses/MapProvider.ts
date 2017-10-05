
import {
  getMapOfCrownstonesBySphereByHandle, getMapOfCrownstonesInAllSpheresByCID,
  getMapOfCrownstonesInAllSpheresByHandle
} from "../util/DataUtil";
import {eventBus} from "../util/EventBus";

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
  cloud2localMap : globalIdMap = { users: {}, locations: {}, appliances: {}, stones: {}, messages: {}, spheres: {} };
  local2cloudMap : globalIdMap = { users: {}, locations: {}, appliances: {}, stones: {}, messages: {}, spheres: {} };

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

      eventBus.on("CloudSyncComplete", () => { this._updateCloudIdMap() })

    }
  }

  _updateCloudIdMap() {
    let state = this._store.getState();
    this.cloud2localMap = { users: {}, locations: {}, appliances: {}, stones: {}, messages: {}, spheres: {} };

    let getFromConfig = (source, cloud2local, local2cloud) => {
      let sourceIds = Object.keys(source);
      sourceIds.forEach((sourceId) => {
        let cloudId = source[sourceId];
        if (cloudId) {
          cloud2local[cloudId] = sourceId;
          local2cloud[sourceId] = cloudId;
        }
      })
    };

    getFromConfig(state.spheres, this.cloud2localMap.spheres, this.local2cloudMap.stones);
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      getFromConfig(sphere.appliances,  this.cloud2localMap.appliances, this.local2cloudMap.stones);
      getFromConfig(sphere.locations,   this.cloud2localMap.locations,  this.local2cloudMap.stones);
      getFromConfig(sphere.stones,      this.cloud2localMap.stones,     this.local2cloudMap.stones);
    });
  }
}


export const MapProvider = new MapProviderClass();