import { core } from "../../../app/ts/Core";
import { NativeBus } from "../../../app/ts/native/libInterface/NativeBus";


let ACTIVE_HANDLE = null;
let ACTIVE_SPHERE_ID = null;
let ACTIVE_STONE_ID = null;
export function eventHelperSetActive(handle, sphereId = null, stoneId = null) {
  ACTIVE_HANDLE    = handle;
  ACTIVE_SPHERE_ID = sphereId;
  ACTIVE_STONE_ID  = stoneId;
}

export function evt_ibeacon(rssi: number = -80, handle: string = ACTIVE_HANDLE, sphereId: string = ACTIVE_SPHERE_ID, stoneId: string = ACTIVE_STONE_ID) {
  core.eventBus.emit("iBeaconOfValidCrownstone", {
    stoneId:  stoneId,
    handle:   handle,
    rssi:     rssi,
    sphereId: sphereId
  });
}

export function evt_connected(handle: string = ACTIVE_HANDLE) {
  // @ts-ignore
  core.nativeBus.emit(NativeBus.topics.connectedToPeripheral, handle);
}

export function evt_connectionFailed(handle: string = ACTIVE_HANDLE) {
  // @ts-ignore
  core.nativeBus.emit(NativeBus.topics.connectedToPeripheralFailed, handle);
}

export function evt_disconnected(handle: string = ACTIVE_HANDLE) {
  // @ts-ignore
  core.nativeBus.emit(NativeBus.topics.disconnectedFromPeripheral, handle);
}