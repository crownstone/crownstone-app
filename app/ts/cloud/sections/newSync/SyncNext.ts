import { core } from "../../../core";
import DeviceInfo from "react-native-device-info";
import { CLOUD } from "../../cloudAPI";
import { LOGe } from "../../../logging/Log";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { xUtil } from "../../../util/StandAloneUtil";
import { getGlobalIdMap } from "../sync/modelSyncs/SyncingBase";
import { SphereSyncer } from "./syncers/SphereSyncerNext";
import { HubSyncer } from "./syncers/HubSyncerNext";
import { mapLocalToCloud } from "./mapping/CloudMapper";


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
      lastTime: 0,
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
    // TODO: sync user
  }

  if (syncResult.spheres) {
    let result = processSpheres(syncResult.spheres, actions, globalCloudIdMap);
    if (Object.keys(result).length > 0) {
      replyRequired = true;
      reply.spheres = result;
    }
  }

  if (syncResult.firmwares) {
    // TODO: sync firmwares
  }

  if (syncResult.bootloaders) {
    // TODO: sync bootloaders
  }

  if (syncResult.keys) {
    // TODO: sync keys
  }

  // provide the requested data.
  if (replyRequired) {
    await CLOUD.syncNext(reply);
  }
}


function processSpheres(sphereResponses: {[sphereId: string] : SyncRequestResponse_Sphere }, actions: any[], globalCloudIdMap: globalIdMap) : SyncRequestSphereData {
  let reply : SyncRequestSphereData = {};
  let state = core.store.getState();
  let syncBase = {globalCloudIdMap: globalCloudIdMap, actions: actions};

  let cloudSphereIds = Object.keys(sphereResponses);
  for (let i = 0; i < cloudSphereIds.length; i++) {
    let cloudSphereId = cloudSphereIds[i];
    let sphereResponse = sphereResponses[cloudSphereId];

    // TODO: use the sphere syncer.
    // let sphereSyncer = new SphereSyncer({cloudId: cloudSphereId, cloudSphereId: cloudSphereId, ...syncBase}).process(sphereResponse.data, reply);

    if (sphereResponse.hubs) {
      let hubsReply = {};
      let hubIds = Object.keys(sphereResponse.hubs);
      for (let j = 0; j < hubIds.length; j++) {
        let hubId = hubIds[j];
        let hubSyncer = new HubSyncer({cloudId: hubId, cloudSphereId: cloudSphereId, ...syncBase}).process(sphereResponse.hubs[hubId].data, hubsReply);
      }
      mergeSphereReply(cloudSphereId, reply, hubsReply)
    }
  }

  return reply;
}

function mergeSphereReply(cloudSphereId: string, reply: SyncRequestSphereData, moduleReply) {
  let moduleKeys = Object.keys(moduleReply);
  if (moduleKeys.length > 0) {
    if (reply[cloudSphereId] === undefined) {
      reply[cloudSphereId] = {};
    }
    for (let i = 0; i < moduleKeys.length; i++) {
      reply[cloudSphereId][moduleKeys[i]] = moduleReply[moduleKeys[i]];
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
