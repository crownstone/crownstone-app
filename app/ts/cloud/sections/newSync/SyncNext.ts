import { core } from "../../../Core";
import DeviceInfo from "react-native-device-info";
import { CLOUD } from "../../cloudAPI";
import { LOGe } from "../../../logging/Log";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { xUtil } from "../../../util/StandAloneUtil";
import { getGlobalIdMap, SyncingBase } from "../sync/modelSyncs/SyncingBase";
import { SphereSyncer } from "./syncers/SphereSyncerNext";
import { HubSyncer } from "./syncers/HubSyncerNext";
import { mapLocalToCloud } from "./mapping/CloudMapper";
import { LocationSyncerNext } from "./syncers/LocationSyncerNext";
import { SyncInterface } from "./syncers/SyncInterface";
import { SceneSyncerNext } from "./syncers/SceneSyncerNext";
import { SphereUserSyncerNext } from "./syncers/SphereUserSyncerNext";


export async function syncNext(scopes : SyncCategory[] = [], actions: any[], globalCloudIdMap: globalIdMap) {
  let scopeMap : SyncScopeMap = {};
  for (let i = 0; i < scopes.length; i++) {
    scopeMap[scopes[i]] = true;
  }

  let state = core.store.getState()

  let syncRequest : SyncRequest = {
    sync: {
      appVersion: DeviceInfo.getReadableVersion(),
      type: "REQUEST",
      lastTime: 0,   // this is not used yet.
      scope: scopes
    },
    spheres: {}
  };

  syncRequest.spheres = composeState(state, scopeMap);
  let response = await CLOUD.syncNext(syncRequest);
  await processSyncResult(response as SyncRequestResponse, actions, globalCloudIdMap);
}

async function processSyncResult(syncResult: SyncRequestResponse, actions = [], globalCloudIdMap: globalIdMap) {
  let replyRequired = false;
  let reply : SyncRequest = {
    sync: {
      appVersion: DeviceInfo.getReadableVersion(),
      type: "REPLY",
      lastTime: 0
    }
  }


  if (syncResult.user) {
    // TODO: sync user via next sync
  }

  if (syncResult.spheres) {
    let result = await processSpheres(syncResult.spheres, actions, globalCloudIdMap);
    if (Object.keys(result).length > 0) {
      replyRequired = true;
      reply.spheres = result;
    }
  }

  if (syncResult.firmwares) {
    // TODO: sync firmwares via next sync
  }

  if (syncResult.bootloaders) {
    // TODO: sync bootloaders via next sync
  }

  if (syncResult.keys) {
    // TODO: sync keys via next sync
  }

  // provide the requested data.
  if (replyRequired) {
    await CLOUD.syncNext(reply);
  }
}


async function processSpheres(sphereCloudResponses: {[sphereId: string] : SyncRequestResponse_Sphere }, actions: any[], globalCloudIdMap: globalIdMap) : Promise<SyncRequestSphereData> {
  let reply : SyncRequestSphereData = {};
  let state = core.store.getState();
  let transferPromises : Promise<any>[] = []
  let syncBase = {globalCloudIdMap, actions, transferPromises};

  let cloudSphereIds = Object.keys(sphereCloudResponses);

  let syncers = [];
  for (let i = 0; i < cloudSphereIds.length; i++) {
    let cloudSphereId = cloudSphereIds[i];
    let sphereCloudResponse = sphereCloudResponses[cloudSphereId];

    new SphereSyncer({cloudId: cloudSphereId, cloudSphereId: cloudSphereId, ...syncBase})
      .process(sphereCloudResponse.data, reply);

    if (sphereCloudResponse.hubs) {
      let moduleReply = {};
      for (let hubId in sphereCloudResponse.hubs) {
        new HubSyncer({cloudId: hubId, cloudSphereId: cloudSphereId, ...syncBase})
          .process(sphereCloudResponse.hubs[hubId].data, moduleReply);
      }
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
    if (sphereCloudResponse.locations) {
      let moduleReply = {};
      for (let locationId in sphereCloudResponse.locations) {
        new LocationSyncerNext({cloudId: locationId, cloudSphereId: cloudSphereId, ...syncBase})
          .process(sphereCloudResponse.locations[locationId].data, moduleReply)
      }
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
    if (sphereCloudResponse.scenes) {
      let moduleReply = {};
      for (let locationId in sphereCloudResponse.scenes) {
        new SceneSyncerNext({cloudId: locationId, cloudSphereId: cloudSphereId, ...syncBase})
          .process(sphereCloudResponse.scenes[locationId].data, moduleReply)
      }
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }

    if (sphereCloudResponse.stones) {
      let moduleReply = {};
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
    if (sphereCloudResponse.toons) {
      let moduleReply = {};
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
    if (sphereCloudResponse.trackingNumbers) {
      let moduleReply = {};
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
    if (sphereCloudResponse.users) {
      let moduleReply = {};
      for (let userId in sphereCloudResponse.users) {
        new SphereUserSyncerNext({cloudId: userId, cloudSphereId: cloudSphereId, ...syncBase})
          .process(sphereCloudResponse.users[userId].data, moduleReply)
      }
      mergeSphereReply(cloudSphereId, reply, moduleReply)
    }
  }

  await Promise.all(transferPromises);

  return reply;
}


function mergeSphereReply(cloudSphereId: string, reply: SyncRequestSphereData, moduleReply) {
  let moduleKeys = Object.keys(moduleReply);
  if (moduleKeys.length > 0) {
    if (reply[cloudSphereId] === undefined) {
      reply[cloudSphereId] = {};
    }
    for (let key of moduleKeys) {
      reply[cloudSphereId][key] = moduleReply[key];
    }
  }
}


function composeState(state, scopeMap : SyncScopeMap) : SyncRequestSphereData {
  let spheres = state.spheres;
  let result : SyncRequestSphereData = {};

  Object.keys(spheres).forEach((sphereId) => {
    let sphere = spheres[sphereId];
    result[sphere.config.cloudId] = {};
    if (scopeMap.hubs) {
      result[sphere.config.cloudId].hubs = gatherRequestData(sphereId, sphere, 'hubs', 'hub')
    }
  })

  return result;
}


/**
 * This method will parse all items under the sphere object that follow these conditions:
 * - have no children of their own. A stone has behaviour and abilities as children.
 * - are of the format sphere[key] = {[itemId:string] : item}
 * @param sphere
 * @param key
 */
function gatherRequestData(sphereId, sphere, key: string, type: SupportedMappingType) : {[itemId:string]: RequestItemCoreType} {
  let result = {};
  let items = sphere[key];
  let itemIds = Object.keys(items);
  if (itemIds.length > 0) {
    for (let i = 0; i < itemIds.length; i++) {
      let itemId = itemIds[i];
      let item = items[itemId];
      if (!item.config.cloudId) {
        result[itemId] = {new: true, data: mapLocalToCloud(sphereId, itemId, item, type)};
      }
      else {
        result[item.config.cloudId || itemId] = {data: {updatedAt: item.config.updatedAt}};
      }
    }
  }
  return result;
}
