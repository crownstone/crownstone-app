import { core } from "../../../app/ts/core";
if (core["reset"] === undefined) { throw "ERROR: mockCore should be performed before the datahelpers are imported."}

import { xUtil } from "../../../app/ts/util/StandAloneUtil";
import { Get } from "../../../app/ts/util/GetUtil";
import { MapProvider } from "../../../app/ts/backgroundProcesses/MapProvider";


/**
 * These methods should be executed AFTER the mock of core.
 */

function getToken(prefix: string) {
  return prefix + "_" + xUtil.getShortUUID();
}
export function resetDataHelper() {
  lastUsedSphereId = null;
  lastUsedStoneId = null;
  stoneCount = 0;
  locationCount = 0;
}


let lastUsedSphereId = null;
let lastUsedStoneId = null;
let stoneCount = 0;
let locationCount = 0;
export function addSphere(config? : any) {
  let sphereId = 'sphere_' + xUtil.getUUID();
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"ADD_SPHERE",
    sphereId: sphereId,
    data:{name: "testSphere", ...config}
  });
  MapProvider.refreshAll();
  lastUsedSphereId = sphereId;
  return Get.sphere(sphereId);
}

export function addStone(config? : any) {
  let stoneId = 'stone_' + xUtil.getUUID();
  stoneCount++;
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"ADD_STONE",
    sphereId: lastUsedSphereId,
    stoneId: stoneId,
    data:{
      handle: 'handle_' + xUtil.getShortUUID(),
      name: getToken('stone'),
      crownstoneId: stoneCount,
      ...config
    }
  });
  MapProvider.refreshAll();
  lastUsedStoneId = stoneId;
  return Get.stone(lastUsedSphereId, stoneId);
}
export function addLocation(config? : any) {
  let locationId = 'location_' + xUtil.getUUID();
  locationCount++;
  if (!config) { config = {}; }
  core.store.dispatch({type:"ADD_LOCATION", sphereId: lastUsedSphereId, locationId: locationId, data:{name: getToken('stone'), ...config}});
  MapProvider.refreshAll();
  lastUsedStoneId = locationId;
  return Get.location(lastUsedSphereId, locationId);
}