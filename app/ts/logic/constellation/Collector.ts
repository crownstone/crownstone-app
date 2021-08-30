/**
 * The Collector will determine which Crownstones will be contacted to attempt to perform a command. It will handle the
 * sourcing of nearby Crownstones, Crownstones in room, direct connection requests as well as attempt connections to
 * multiple Crownstones to deliver a message, after a few successful connections, the rest of the slots can be cancelled.
 */
import { SessionManager } from "./SessionManager";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Get } from "../../util/GetUtil";
import { core } from "../../Core";

/**
 * The collector is a util class that gathers handles you can request sessions for.
 */
export const Collector = {

  /**
   * This method will collect all handles that belong to this mesh network. The ignoreHandle can be used for meshRelay
   * commands, where we also schedule a direct command to a Crownstone. This Crownstone's handle can be ignored for this.
   * @param meshId
   * @param ignoreHandle
   */
  collectMesh : function(meshId : string, ignoreHandle: string = null) : string[] {
    let handles = [];
    let meshData = MapProvider.meshMap[meshId];
    let stoneIds = Object.keys(meshData);
    for (let stoneId of stoneIds) {
      let stoneData = meshData[stoneId];
      if (stoneData.handle !== ignoreHandle) {
        handles.push({ handle: stoneData.handle, rssi: StoneAvailabilityTracker.getAvgRssi(stoneId) });
      }
    };
    handles.sort((a,b) => { return b.rssi - a.rssi });
    return handles.map((a) => { return a.handle });
  },

  collectSphere : function(sphereId : string, ignoreHandle: string = null) : string[] {
    let sphereStones = this._getSphereStones(sphereId);
    let handles = [];
    for (let i = 0; i < sphereStones.length; i++) {
      if (sphereStones[i].handle !== ignoreHandle) {
        handles.push(sphereStones[i].handle);
      }
    }
    return handles;
  },

  collectNearby : function(sphereId: string) : string[] {
    let sphereStones = this._getSphereStones(sphereId);
    return sphereStones.map((a) => { return a.handle });
  },

  collectLocation : function(locationId)  : string[]{
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let locationSphereId = null;
    for (let sphereId of sphereIds) {
      if (state.spheres[sphereId].locations[locationId] !== undefined) {
        locationSphereId = sphereId;
        break;
      }
    }
    if (locationSphereId === null) { return []; }

    let sphereStones = this._getSphereStones(locationSphereId);
    let locationStoneMap = sphereStones.filter((data) => { return data.locationId === locationId; })
    return locationStoneMap.map((a) => { return a.handle });
  },

  _getSphereStones(sphereId) : {handle: string, rssi: number, locationId: string}[] {
    let handles = [];
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return [] };

    let stoneIds = Object.keys(sphere.stones);
    for (let stoneId of stoneIds) {
      let stone = sphere.stones[stoneId];
      handles.push({handle: stone.config.handle, rssi: StoneAvailabilityTracker.getAvgRssi(stoneId), locationId: stone.config.locationId});
    };
    handles.sort((a,b) => { return b.rssi - a.rssi });
    return handles;
  }
}