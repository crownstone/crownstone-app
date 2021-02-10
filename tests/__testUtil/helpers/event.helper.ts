import { core } from "../../../ts/core";


let ACTIVE_HANDLE = null;
let ACTIVE_SPHERE_ID = null;
let ACTIVE_STONE_ID = null;
export function eventHelperSetActive(handle, sphereId = null, stoneId = null) {
  ACTIVE_HANDLE    = handle;
  ACTIVE_SPHERE_ID = sphereId;
  ACTIVE_STONE_ID  = stoneId;
}

export function ibeacon(rssi: number = -80, handle: string = ACTIVE_HANDLE, sphereId: string = ACTIVE_SPHERE_ID, stoneId: string = ACTIVE_STONE_ID) {
  core.eventBus.emit("iBeaconOfValidCrownstone", {
    stoneId:  sphereId,
    handle:   handle,
    rssi:     rssi,
    sphereId: sphereId
  });
}