export class SyncingBase {
  actions: any[];
  transferPromises : any[];
  globalCloudIdMap : globalIdMap;
  globalLocalIdMap : globalIdMap;

  constructor(actions : any[], transferPromises: any[], globalCloudIdMap: globalIdMap) {
    if (!globalCloudIdMap) {
      globalCloudIdMap = getGlobalIdMap();
    }

    this.globalCloudIdMap = globalCloudIdMap;
    this.actions = actions;
    this.transferPromises = transferPromises;
  }

  _constructLocalIdMap() {
    this.globalLocalIdMap = getGlobalIdMap();
    let globalKeys = Object.keys(this.globalCloudIdMap);
    globalKeys.forEach((key) => {
      this.globalLocalIdMap[key] = {};

      let cloudIds = Object.keys(this.globalCloudIdMap[key]);
      cloudIds.forEach((cloudId) => {
        let localId = this.globalCloudIdMap[key][cloudId];
        this.globalLocalIdMap[key][localId] = cloudId;
      })
    })
  }

  _getLocalData(store) {}

  download(cloudSphereId) {
    // should be implemented if the data should be pulled by the sync script
  }

  sync(...any) {
    throw "SyncingBase: NOT OVERLOADED sync";
  }

  syncDown(...any) {
    throw "SyncingBase: NOT OVERLOADED syncDown";
  }

  syncUp(...any) {
    throw "SyncingBase: NOT OVERLOADED syncUp";
  }

  syncChildren(...any) {
    // should be implemented if the
  }


  /**
   * This should give a map of keys : cloudId, value: local Id
   *
   * Rough outline:
   *

   let cloudIdMap = {};
   let thingIds = Object.keys(thingsInState);
   thingIds.forEach((localThingId) => {
      let thing = thingsInState[localThingId];
      let cloudIdInThing = thing.config.cloudId; // <---------- location of cloudId in data model can be different!
      if (cloudIdInThing) {
        cloudIdMap[cloudIdInThing] = localThingId;
      }
    });

   return cloudIdMap;

   * @param thingsInState
   * @private
   */
  _getCloudIdMap(thingsInState : any) {
    throw "SyncingBase: NOT OVERLOADED _getCloudIdMap";
  }




  /**
   * This should give an Id of a locally stored object that should match the remote object.
   *
   * Rough outline:
   *

   let thingIds = Object.keys(thingsInState);
   for (let i = 0; i < thingIds.length; i++) {
      let thing = thingsInState[thingIds[i]];
      if (<NUMBER OF CONDITIONS TO MATCH LOCAL DATA WITH CLOUD DATA>) {
        return thingIds[i];
      }
   }
   return null;

   * @param thingsInState
   * @param thing_in_cloud
   * @private
   */
  _searchForLocalMatch(thingsInState, thing_in_cloud) {
    throw "SyncingBase: NOT OVERLOADED _searchForLocalMatch"
  }
}

export class SyncingSphereItemBase extends SyncingBase {
  localSphereId   : string;
  cloudSphereId   : string;
  globalSphereMap : globalIdMap;

  constructor(
    actions : any[],
    transferPromises: any[],
    localSphereId: string,
    cloudSphereId: string,
    globalCloudIdMap: globalIdMap,
    globalSphereMap: globalIdMap
  ) {
    super(actions, transferPromises, globalCloudIdMap);
    this.localSphereId = localSphereId;
    this.cloudSphereId = cloudSphereId;
    this.globalSphereMap = globalSphereMap;
  }
}


export function getGlobalIdMap() : globalIdMap {
  return {
    devices:     {},
    locations:   {},
    messages:    {},
    preferences: {},
    stones:      {},
    spheres:     {},
    schedules:   {},
    toons:       {},
    users:       {},
  }
}