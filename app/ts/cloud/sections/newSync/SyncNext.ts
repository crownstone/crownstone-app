import { core } from "../../../Core";
import DeviceInfo from "react-native-device-info";
import { CLOUD } from "../../cloudAPI";
import { LOGe } from "../../../logging/Log";
import { MapProvider } from "../../../backgroundProcesses/MapProvider";
import { xUtil } from "../../../util/StandAloneUtil";
import { getGlobalIdMap, SyncingBase } from "../sync/modelSyncs/SyncingBase";
import { SphereSyncerNext } from "./syncers/SphereSyncerNext";
import { HubSyncer } from "./syncers/HubSyncerNext";
import { mapLocalToCloud } from "./mapping/CloudMapper";
import { LocationSyncerNext } from "./syncers/LocationSyncerNext";
import { SyncInterface } from "./syncers/SyncInterface";
import { SceneSyncerNext } from "./syncers/SceneSyncerNext";
import { SphereUserSyncerNext } from "./syncers/SphereUserSyncerNext";
import { StoneSyncerNext } from "./syncers/StoneSyncerNext";
import { BehaviourSyncerNext } from "./syncers/BehaviourSyncerNext";
import { AbilitySyncerNext } from "./syncers/AbilitySyncerNext";
import { AbilityPropertySyncerNext } from "./syncers/AbilityPropertySyncerNext";



export const SyncNext = {
  sync: async function syncNext(scopes : SyncCategory[] = [], actions: any[], globalCloudIdMap: globalIdMap) {
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

    syncRequest.spheres = SyncNext.composeState(state, scopeMap);
    let response = await CLOUD.syncNext(syncRequest);
    await SyncNext.processSyncResult(response as SyncRequestResponse, actions, globalCloudIdMap);
  },

  processSyncResult: async function processSyncResult(syncResult: SyncRequestResponse, actions = [], globalCloudIdMap: globalIdMap) {
    let replyRequired = false;
    let reply : SyncRequest = {
      sync: {
        appVersion: DeviceInfo.getReadableVersion(),
        type:       "REPLY",
        lastTime:   0
      }
    }


    if (syncResult.user) {
      // TODO: sync user via next sync
    }

    if (syncResult.spheres) {
      let result = await SyncNext.processSpheres(syncResult.spheres, actions, globalCloudIdMap);
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
    // if (replyRequired) {
    //   await CLOUD.syncNext(reply);
    // }
  },


  processSpheres: async function processSpheres(sphereCloudResponses: {[sphereId: string] : SyncRequestResponse_Sphere }, actions: any[], globalCloudIdMap: globalIdMap) : Promise<SyncRequestSphereData> {
    let reply : SyncRequestSphereData = {};
    let state = core.store.getState();
    let transferPromises : Promise<any>[] = []
    let syncBase = {globalCloudIdMap, actions, transferPromises};

    let cloudSphereIds = Object.keys(sphereCloudResponses);

    let syncers = [];
    for (let i = 0; i < cloudSphereIds.length; i++) {
      let cloudSphereId = cloudSphereIds[i];
      let sphereCloudResponse = sphereCloudResponses[cloudSphereId];
      let sphereSyncBase = {cloudSphereId, ...syncBase};
      new SphereSyncerNext({cloudId: cloudSphereId, ...sphereSyncBase})
        .process(sphereCloudResponse.data, reply);

      if (sphereCloudResponse.hubs) {
        let moduleReply = {};
        for (let hubId in sphereCloudResponse.hubs) {
          new HubSyncer({cloudId: hubId, ...sphereSyncBase})
            .process(sphereCloudResponse.hubs[hubId].data, moduleReply);
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      if (sphereCloudResponse.locations) {
        let moduleReply = {};
        for (let locationId in sphereCloudResponse.locations) {
          new LocationSyncerNext({cloudId: locationId, ...sphereSyncBase}).process(sphereCloudResponse.locations[locationId].data, moduleReply)
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      if (sphereCloudResponse.scenes) {
        let moduleReply = {};
        for (let locationId in sphereCloudResponse.scenes) {
          new SceneSyncerNext({cloudId: locationId, ...sphereSyncBase}).process(sphereCloudResponse.scenes[locationId].data, moduleReply)
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }

      if (sphereCloudResponse.stones) {
        let moduleReply = {};
        for (let stoneId in sphereCloudResponse.stones) {
          let stoneResponse = sphereCloudResponse.stones[stoneId]
          new StoneSyncerNext({cloudId: stoneId, ...sphereSyncBase}).process(stoneResponse.data, moduleReply);
          for (let behaviourId in stoneResponse.behaviours) {
            new BehaviourSyncerNext({cloudId: behaviourId, ...sphereSyncBase}, stoneId).process(stoneResponse.behaviours[behaviourId].data, moduleReply);
          }
          for (let abilityId in stoneResponse.abilities) {
            let ability = stoneResponse.abilities[abilityId];
            new AbilitySyncerNext({cloudId: abilityId, ...sphereSyncBase}, stoneId).process(ability.data, moduleReply);

            for (let propertyId in ability.properties) {
              new AbilityPropertySyncerNext({cloudId: abilityId, ...sphereSyncBase}, stoneId, abilityId).process(ability.properties[propertyId].data, moduleReply);
            }
          }

        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      if (sphereCloudResponse.toons) {
        let moduleReply = {};
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      if (sphereCloudResponse.trackingNumbers) {
        let moduleReply = {};
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      if (sphereCloudResponse.users) {
        let moduleReply = {};
        for (let userId in sphereCloudResponse.users) {
          new SphereUserSyncerNext({cloudId: userId,  ...sphereSyncBase}).process(sphereCloudResponse.users[userId].data, moduleReply)
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
    }

    await Promise.all(transferPromises);

    return reply;
  },


  mergeSphereReply: function mergeSphereReply(cloudSphereId: string, reply: SyncRequestSphereData, moduleReply) {
    let moduleKeys = Object.keys(moduleReply);
    if (moduleKeys.length > 0) {
      if (reply[cloudSphereId] === undefined) {
        reply[cloudSphereId] = {};
      }
      for (let key of moduleKeys) {
        reply[cloudSphereId][key] = moduleReply[key];
      }
    }
  },


  composeState: function composeState(state, scopeMap : SyncScopeMap) : SyncRequestSphereData {
    let spheres = state.spheres;
    let result : SyncRequestSphereData = {};

    Object.keys(spheres).forEach((sphereId) => {
      let sphere = spheres[sphereId];
      let sphere_cloudId = sphere.config.cloudId;
      result[sphere_cloudId] = {};

      function gather(options?) {
        return gatherRequestData(sphere, options)
      }

      if (scopeMap.spheres) {
        result[sphere_cloudId] = {data: SphereSyncerNext.mapLocalToCloud(sphere)}
      }
      if (scopeMap.hubs) {
        result[sphere_cloudId].hubs = gather({key:'hubs', type:'hub'})
      }
      if (scopeMap.locations) {
        result[sphere_cloudId].locations = gather({key:'locations', type:'location'})
      }
      if (scopeMap.stones || true) {
        result[sphere_cloudId].stones = gather({key:'stones', type:'stone', children: [
            {key:'rules',     type:'behaviour', cloudKey: 'behaviours'},
            {key:'abilities', type:'ability', children: [
                {key:'properties', type:'abilityProperty'},
              ]},
          ]})
      }
      if (scopeMap.scenes) {
        result[sphere_cloudId].scenes = gather({key:'scenes', type:'scene'})
      }
      if (scopeMap.sphereUsers) {
        result[sphere_cloudId].users = gather({key:'users', type:'sphereUser', cloudIdGetter: (item) => { return item.id; }})
      }
    })

    return result;
  }
}




interface GatherOptions {
  key:        string,
  cloudKey?:  string,
  type:       SupportedMappingType,
  children?:  GatherOptions[]
  cloudIdGetter?:   (item: any) => string,
  updatedAtGetter?: (item: any) => string,
}


/**
 * This method will parse all items under the sphere object that follow these conditions:
 * - have no children of their own. A stone has behaviour and abilities as children.
 * - are of the format sphere[key] = {[itemId:string] : item}
 * @param source
 * @param options
 */
function gatherRequestData(
  source,
  options: GatherOptions
) : {[itemId:string]: RequestItemCoreType} {

  let result = {};
  let items = source[options.key]; // this will get a object of items like sphere[stones]
  let itemIds = Object.keys(items ?? {});

  let cloudIdGetter   = options.cloudIdGetter   ?? getCloudId;
  let updatedAtGetter = options.updatedAtGetter ?? getUpdatedAt;

  if (itemIds.length > 0) {
    for (let itemId of itemIds) {
      let item = items[itemId];
      if (!cloudIdGetter(item)) {
        result[itemId] = {new: true, data: mapLocalToCloud(item, options.type)};
      }
      else {
        result[cloudIdGetter(item) || itemId] = {data: {updatedAt: updatedAtGetter(item)}};
      }

      let resultItem = result[cloudIdGetter(item) || itemId];

      let children = options.children ?? [];
      for (let childOptions of children) {
        resultItem[childOptions.cloudKey ?? childOptions.key] = gatherRequestData(item, childOptions);
      }
    }
  }
  return result;
}


function getCloudId(item: any) : string {
  if (item.config === undefined) {
    return item.cloudId;
  }
  return item.config.cloudId;
}


function getUpdatedAt(item: any) : string {
  if (item.config === undefined) {
    return item.updatedAt;
  }
  return item.config.updatedAt;
}

