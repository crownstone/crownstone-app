import { DataUtil } from "../../../../util/DataUtil";
import { MapProvider } from "../../../../backgroundProcesses/MapProvider";
import { SyncInterface } from "./SyncInterface";
import { Get } from "../../../../util/GetUtil";



export class HubSyncer extends SyncInterface<HubData, cloud_Hub, cloud_Hub_settable> {

  getLocalId() {
    return this.globalCloudIdMap.hubs[this.cloudId] || MapProvider.cloud2localMap.hubs[this.cloudId];
  }

  // this will be used for NEW data and REQUESTED data in the v2 sync process.
  static mapLocalToCloud(localSphereId: string, localId: string, localData: HubData) : cloud_Hub_settable | null {
    let result : cloud_Hub_settable = {
      name:          localData.config.name,
      linkedStoneId: MapProvider.local2cloudMap.stones[localData.config.linkedStoneId] || localData.config.linkedStoneId || null,
      locationId:    MapProvider.local2cloudMap.locations[localData.config.locationId] || localData.config.locationId    || null,
      updatedAt:     new Date(localData.config.updatedAt).toISOString(),
    };
    return result;
  }


  static mapCloudToLocal(cloudHub: cloud_Hub, localStoneId?: string, localLocationId?: string) {
    let result : any = {};
    localStoneId    = localStoneId    ?? MapProvider.cloud2localMap.stones[cloudHub.linkedStoneId] ?? cloudHub.linkedStoneId;
    localLocationId = localLocationId ?? MapProvider.cloud2localMap.locations[cloudHub.locationId] ?? cloudHub.locationId;

    if (localStoneId) {
      result.linkedStoneId = localStoneId;
    }

    if (localLocationId) {
      result.locationId = localLocationId;
    }

    result.name            = cloudHub.name;
    result.ipAddress       = cloudHub.localIPAddress;
    result.httpPort        = cloudHub.httpPort  || 80;
    result.httpsPort       = cloudHub.httpsPort || 443;
    result.cloudId         = cloudHub.id;
    result.lastSeenOnCloud = new Date(cloudHub.lastSeen).valueOf();;
    result.updatedAt       = new Date(cloudHub.updatedAt).valueOf();

    return result;
  }

  _mapCloudToLocal(cloudHub: cloud_Hub) {
    let localLocationId = this.globalCloudIdMap.locations[cloudHub.locationId] ?? MapProvider.cloud2localMap.locations[cloudHub.locationId] ?? cloudHub.locationId;
    let localStoneId    = this.globalCloudIdMap.stones[cloudHub.linkedStoneId] ?? MapProvider.cloud2localMap.stones[cloudHub.linkedStoneId] ?? cloudHub.linkedStoneId;

    return HubSyncer.mapCloudToLocal(cloudHub, localStoneId, localLocationId);
  }

  updateCloudId(cloudId) {
    this.actions.push({type:"UPDATE_HUB_CLOUD_ID", sphereId: this.localSphereId, hubId: this.localId, data: {cloudId}});
  }

  removeFromLocal() {
    this.actions.push({type:"REMOVE_HUB", sphereId: this.localSphereId, hubId: this.localId });
  }

  createLocal(cloudData: cloud_Hub) {
    let newId = this._generateLocalId();
    this.globalCloudIdMap.hubs[this.cloudId] = newId;
    this.actions.push({type:"ADD_HUB", sphereId: this.localSphereId, hubId: newId, data: this._mapCloudToLocal(cloudData) })
  }

  updateLocal(cloudData: cloud_Hub) {
    this.actions.push({type:"UPDATE_HUB_CONFIG", sphereId: this.localSphereId, hubId: this.localId, data: this._mapCloudToLocal(cloudData) })
  }

  setReplyWithData(reply: SyncRequestSphereData) {
    let hub = Get.hub(this.localSphereId, this.localId);
    if (!hub) { return null; }
    if (reply.hubs === undefined) {
      reply.hubs = {};
    }
    if (reply.hubs[this.cloudId] === undefined) {
      reply.hubs[this.cloudId] = {};
    }
    reply.hubs[this.cloudId].data = HubSyncer.mapLocalToCloud(this.localSphereId, this.localId, hub)
  }
}

