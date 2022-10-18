import { core } from "../../../app/ts/Core";
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
  hubCount = 0;
  stoneCount = 0;
  locationCount = 0;
}


let lastUsedSphereId = null;
let lastUsedStoneId = null;
let hubCount = 0;
let stoneCount = 0;
let locationCount = 0;

interface SphereDataTest extends SphereDataConfig {
  id: string
}

export function createUser(config? : Partial<UserData>) {
  // @ts-ignore
  let userId = config?.id ?? 'user_' + xUtil.getUUID();
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"USER_LOG_IN",
    data:{
      firstName: "Test",
      lastName:  "LastName",
      userId:     userId,
      ...config
    }
  });

  let state = core.store.getState();
  return state.user;
}

export function addSphere(config? : Partial<SphereDataTest>) {
  // @ts-ignore
  let sphereId = config?.id ?? 'sphere_' + xUtil.getUUID();
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"ADD_SPHERE",
    sphereId: sphereId,
    data:{name: "testSphere", iBeaconUUID: xUtil.getUUID(), ...config}
  });
  MapProvider.refreshAll();
  lastUsedSphereId = sphereId;
  return Get.sphere(sphereId);
}

export function addStone(config? : Partial<StoneDataConfig>) {
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
      uid: stoneCount,
      firmwareVersion:'5.4.0',
      iBeaconMajor: Number('0x'+xUtil.getRandomByte()+xUtil.getRandomByte()),
      iBeaconMinor: Number('0x'+xUtil.getRandomByte()+xUtil.getRandomByte()),
      ...config
    }
  });
  MapProvider.refreshAll();
  lastUsedStoneId = stoneId;

  let stone = Get.stone(lastUsedSphereId, stoneId);
  return { stone, handle: stone.config.handle };
}



export function addMessage(config? : Partial<MessageData>, recipients: string[] = []) {
  let messageId = 'messageId_' + xUtil.getUUID();
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"ADD_MESSAGE",
    sphereId: lastUsedSphereId,
    messageId,
    data:{
      content:"testMessage",
      triggerEvent: 'enter',
      everyoneInSphere: recipients.length == 0,
      recipients: xUtil.arrayToMap(recipients ?? []),
      ...config
    }
  });

  let message = Get.message(lastUsedSphereId, messageId);
  return message;
}


export function addHub(config? : any) {
  let hubId = 'hub_' + xUtil.getUUID();
  hubCount++;
  if (!config) { config = {}; }
  core.store.dispatch({
    type:"ADD_HUB",
    sphereId: lastUsedSphereId,
    hubId: hubId,
    data:{
      name: getToken('hub'),
      cloudId: hubCount,
      ...config
    }
  });
  MapProvider.refreshAll();

  return Get.hub(lastUsedSphereId, hubId);
}
export function addLocation(config? : any) {
  let locationId = 'location_' + xUtil.getUUID();
  locationCount++;
  if (!config) { config = {}; }
  core.store.dispatch({type:"ADD_LOCATION", sphereId: lastUsedSphereId, locationId: locationId, data:{name: getToken('stone'), ...config}});
  MapProvider.refreshAll();
  return Get.location(lastUsedSphereId, locationId);
}

export function addSphereUser(config? : any) {
  let userId = 'sphereUser_' + xUtil.getUUID();
  locationCount++;
  if (!config) { config = {}; }
  core.store.dispatch({type:"ADD_SPHERE_USER", sphereId: lastUsedSphereId, userId: userId, data:{name: getToken('user'), ...config}});
  MapProvider.refreshAll();
  return Get.sphereUser(lastUsedSphereId, userId);
}

export function createMockDatabase() {
  let sphere = addSphere();
  let location1 = addLocation();
  let location2 = addLocation();
  let location3 = addLocation();
  let location4 = addLocation();
  let stone1 = addStone({locationId: location2.id});
  let stone2 = addStone({locationId: location2.id});
  let stone3 = addStone({locationId: location3.id});
  let stone4 = addStone({locationId: location4.id});
  let stone5 = addStone({locationId: location1.id});
  let stone6 = addStone({locationId: location1.id});
  return {
    sphere,
    locations: [location1, location2, location3, location4],
    stones: [stone1, stone2, stone3, stone4, stone5, stone6]
  };
}

export function loadDump(dumpState) {
  core.store.dispatch({type:"HYDRATE", data: {state: dumpState}});
  MapProvider.refreshAll();
}
