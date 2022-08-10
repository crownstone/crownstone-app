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

export function ibeaconPayload(sphere: SphereData, stone: StoneData, rssi = -65) : ibeaconPackage {
  return {
    id    : `${sphere.config.iBeaconUUID}_${stone.config.iBeaconMajor}_${stone.config.iBeaconMinor}`, // uuid + "_Maj:" + string(major) + "_Min:" + string(minor)
    uuid  : sphere.config.iBeaconUUID.toUpperCase(), // this is the iBeacon UUID in uppercase: "E621E1F8-C36C-495A-93FC-0C247A3E6E5F"
    major : stone.config.iBeaconMajor, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
    minor : stone.config.iBeaconMinor, // string because it is an ID that can get string operations, never calculations. Can be filled with int as well.
    rssi  : rssi,
    referenceId : sphere.id, // The sphere ID, as given in trackIBeacon().
  }
}
