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
import { SceneSyncerNext } from "./syncers/SceneSyncerNext";
import { SphereUserSyncerNext } from "./syncers/SphereUserSyncerNext";
import { StoneSyncerNext } from "./syncers/StoneSyncerNext";
import { BehaviourSyncerNext } from "./syncers/BehaviourSyncerNext";
import { AbilitySyncerNext } from "./syncers/AbilitySyncerNext";
import { AbilityPropertySyncerNext } from "./syncers/AbilityPropertySyncerNext";
import { FirmwareSyncerNext } from "./syncers/FirmwareSyncerNext";
import { BootloaderSyncerNext } from "./syncers/BootloaderSyncerNext";
import { KeySyncerNext } from "./syncers/KeySyncerNext";
import { UserSyncerNext } from "./syncers/UserSyncerNext";
import { ToonSyncerNext } from "./syncers/ToonSyncerNext";
import { SphereTransferNext } from "./transferrers/SphereTransferNext";
import { SphereUserTransferNext } from "./transferrers/SphereUserTransferNext";
import { Get } from "../../../util/GetUtil";


export const SyncNext = {

  partialSphereSync: async function(localSphereId: string, type: "SPHERE_USERS") {
    let scopes : SyncCategory[] = [];
    let sphere = Get.sphere(localSphereId);
    if (!sphere) { return; }

    let actions = [];
    let globalCloudIdMap = getGlobalIdMap();

    switch (type) {
      case "SPHERE_USERS":
        scopes = ["sphereUsers"]
        let syncRequest = getRequestBase(scopes);
        syncRequest.spheres[sphere.config.cloudId].users = SphereUserSyncerNext.prepare(sphere);
        let response = await CLOUD.syncNextSphere(localSphereId, syncRequest);
        await SyncNext.processSyncResponse(response as SyncRequestResponse, actions, globalCloudIdMap);
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions)
    }
  },

  partialStoneSync: async function(localStoneId: string, type: "ABILITIES" | "BEHAVIOURS") {
    let scopes : SyncCategory[] = [];
    let sphereId = Get.sphereId(localStoneId);
    if (!sphereId) { return; }
    let sphere   = Get.sphere(sphereId);
    if (!sphere) { return; }

    let actions = [];
    let globalCloudIdMap = getGlobalIdMap();

    switch (type) {
      case "ABILITIES":
      case "BEHAVIOURS":
        scopes = ["stones"]
        let syncRequest = getRequestBase(scopes);
        syncRequest.spheres[sphere.config.cloudId].stones = StoneSyncerNext.prepare(sphere);
        let response = await CLOUD.syncNextStone(localStoneId, syncRequest);
        await SyncNext.processSyncResponse(response as SyncRequestResponse, actions, globalCloudIdMap);
        break;
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions)
    }
  },

  sync: async function syncNext(scopes : SyncCategory[] = [], actions: DatabaseAction[], globalCloudIdMap: globalIdMap) {
    let scopeMap : SyncScopeMap = {};
    let nextActions : DatabaseAction[] = [];
    for (let i = 0; i < scopes.length; i++) {
      scopeMap[scopes[i]] = true;
    }

    let syncRequest = getRequestBase(scopes);

    let state = core.store.getState()
    if (state?.user?.updatedAt) {
      syncRequest.user = { updatedAt: state?.user?.updatedAt };
    }
    syncRequest.spheres = SyncNext.composeState(state, scopeMap);
    // console.log("SYNC REQUEST", JSON.stringify(syncRequest))
    let response = await CLOUD.syncNext(syncRequest);
    // console.log("SYNC response", JSON.stringify(response))
    await SyncNext.processSyncResponse(response as SyncRequestResponse, nextActions, globalCloudIdMap);
    // console.log("SYNC ACTIONS", JSON.stringify(nextActions))
    for (let an of nextActions) {
      actions.push(an);
    }
  },

  processSyncResponse: async function processSyncResult(syncResponse: SyncRequestResponse, actions = [], globalCloudIdMap: globalIdMap) {
    let transferPromises : Promise<any>[] = []
    let syncerOptions    : SyncInterfaceViewOptions = {actions, globalCloudIdMap, transferPromises}
    let replyRequired = false;
    let reply : SyncRequest = {
      sync: {
        appVersion: DeviceInfo.getReadableVersion(),
        type:       "REPLY",
        lastTime:   0
      }
    }


    if (syncResponse.user) {
      new UserSyncerNext(syncerOptions).process(syncResponse.user, reply)
    }

    if (syncResponse.spheres) {
      let result = await SyncNext.processSpheres(syncResponse.spheres, actions, globalCloudIdMap);
      if (Object.keys(result).length > 0) {
        replyRequired = true;
        reply.spheres = result;
      }
    }

    if (syncResponse.firmwares) {
      new FirmwareSyncerNext(syncerOptions).process(syncResponse.firmwares);
    }

    if (syncResponse.bootloaders) {
      new BootloaderSyncerNext(syncerOptions).process(syncResponse.bootloaders);
    }

    if (syncResponse.keys) {
      new KeySyncerNext(syncerOptions).process(syncResponse.keys);
    }


    // console.log("REPLYREQUIRED", replyRequired);
    // console.log("REPLY", JSON.stringify(reply));
    // provide the requested data.
    if (replyRequired) {
      await CLOUD.syncNext(reply);
    }
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
              new AbilityPropertySyncerNext({cloudId: propertyId, ...sphereSyncBase}, stoneId, abilityId).process(ability.properties[propertyId].data, moduleReply);
            }
          }

        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }

      if (sphereCloudResponse.hubs) {
        let moduleReply = {};
        for (let hubId in sphereCloudResponse.hubs) {
          new HubSyncer({cloudId: hubId, ...sphereSyncBase})
            .process(sphereCloudResponse.hubs[hubId].data, moduleReply);
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }

      // this order is important. The hub has dependencies on stones and locations
      if (sphereCloudResponse.toons) {
        let moduleReply = {};
        for (let toonId in sphereCloudResponse.toons) {
          new ToonSyncerNext({ cloudId: toonId, ...sphereSyncBase }).process(sphereCloudResponse.toons[toonId].data, moduleReply)
        }
        SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      }
      // if (sphereCloudResponse.trackingNumbers) {
      //   let moduleReply = {};
      //   SyncNext.mergeSphereReply(cloudSphereId, reply, moduleReply)
      // }
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

      function gather(options : GatherOptions) {
        return SyncNext.gatherRequestData(sphere, options)
      }

      if (scopeMap.spheres) {
        result[sphere_cloudId] = {data: SphereTransferNext.mapLocalToCloud(sphere)};
      }
      if (scopeMap.hubs) {
        result[sphere_cloudId].hubs = HubSyncer.prepare(sphere)
      }
      if (scopeMap.locations) {
        result[sphere_cloudId].locations = LocationSyncerNext.prepare(sphere);
      }
      if (scopeMap.stones) {
        result[sphere_cloudId].stones = StoneSyncerNext.prepare(sphere);
      }
      if (scopeMap.scenes) {
        result[sphere_cloudId].scenes = SceneSyncerNext.prepare(sphere);
      }
      if (scopeMap.sphereUsers) {
        result[sphere_cloudId].users = SphereUserSyncerNext.prepare(sphere);
      }
      if (scopeMap.toons) {
        result[sphere_cloudId].toons = ToonSyncerNext.prepare(sphere);
      }
    })

    return result;
  },


  /**
   * This method will parse all items under the sphere object that follow these conditions:
   * - have no children of their own. A stone has behaviour and abilities as children.
   * - are of the format sphere[key] = {[itemId:string] : item}
   * @param source    | This is the parent model of the item. Sphere for Locations etc.
   * @param options
   */
  gatherRequestData: function gatherRequestData(
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
          let dataForCloud = mapLocalToCloud(item, options.type);
          if (!dataForCloud) {
            dataForCloud = {updatedAt: updatedAtGetter(item)}
          }
          result[itemId] = {new: true, data: dataForCloud};
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
  },
}



function getRequestBase(scopes: SyncCategory[]) : SyncRequest {
  return {
    sync: {
      appVersion: DeviceInfo.getReadableVersion(),
      type: "REQUEST",
      lastTime: 0,   // this is not used yet.
      scope: scopes
    },
    spheres: {}
  };
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

