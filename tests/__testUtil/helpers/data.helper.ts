import { core } from "../../../app/ts/core";
if (core["resetMocks"] === undefined) { throw "ERROR: mockCore should be performed before the datahelpers are imported."}

import { xUtil } from "../../../app/ts/util/StandAloneUtil";
import { Get } from "../../../app/ts/util/GetUtil";
import { MapProvider } from "../../../app/ts/backgroundProcesses/MapProvider";


/**
 * These methods should be executed AFTER the mock of core.
 */

function getToken(prefix: string) {
  return prefix + "_" + xUtil.getShortUUID();
}

let lastUsedSphereId = null;
let lastUsedStoneId = null;
let stoneCount = 0;
export function addSphere(config? : any) {
  let sphereId = xUtil.getUUID();
  if (!config) { config = {}; }
  core.store.dispatch({type:"ADD_SPHERE", sphereId: sphereId, data:{name: "testSphere", ...config}});
  MapProvider.refreshAll();
  lastUsedSphereId = sphereId;
  return Get.sphere(sphereId);
}

export function addStone(config? : any) {
  let stoneId = xUtil.getUUID();
  stoneCount++;
  if (!config) { config = {}; }
  core.store.dispatch({type:"ADD_STONE", sphereId: lastUsedSphereId, stoneId: stoneId, data:{handle: xUtil.getShortUUID(), name: getToken('stone'), crownstoneId: stoneCount, ...config}});
  MapProvider.refreshAll();
  lastUsedStoneId = stoneId;
  return Get.stone(lastUsedSphereId, stoneId);
}