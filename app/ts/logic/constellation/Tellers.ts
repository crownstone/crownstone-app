import { BroadcastCommandManager } from "../bchComponents/BroadcastCommandManager";
import { SessionManager } from "./SessionManager";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";
import { core } from "../../core";
import { CommandAPI } from "./Commander";
import { Get } from "../../util/GetUtil";
import { LOGd } from "../../logging/Log";


export async function connectTo(handle, timeoutSeconds = 30) : Promise<CommandAPI> {
  LOGd.constellation("Tellers: Starting a direct connection.", handle);

  let privateId = xUtil.getUUID();
  let stoneData = MapProvider.stoneHandleMap[handle];
  let sphereId = null;
  if (stoneData) {
    sphereId = stoneData.sphereId;
  }
  await SessionManager.request(handle, privateId, true, timeoutSeconds);
  let commander = new CommandAPI({
    commanderId:    privateId,
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        true
  });

  commander.broker.loadSession(handle);
  return commander;
}

/**
 * The tellers are functions which return a chainable command API to a single Crownstone.
 * This will also be able to possibly use a hub to propagate these commands.
 */
export function tell(handle: string | StoneData) : CommandAPI {
  if (typeof handle != 'string') {
    handle = handle.config.handle
  }

  let sphereId = MapProvider.stoneHandleMap[handle].sphereId

  return new CommandAPI({
    commanderId:    xUtil.getUUID(),
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        false
  });
}


/**
 * @param meshId
 * @param minimalConnections
 */
export function tellMesh(meshId, minConnections = 3) : CommandAPI {
  let stonesInMap = MapProvider.meshMap[meshId];
  let stoneIds = Object.keys(stonesInMap);
  if (stoneIds.length > 0) {
    let item = stonesInMap[stoneIds[0]];
    let sphereId = item.sphereId;
    return new CommandAPI({
      commanderId:    xUtil.getUUID(),
      sphereId:       sphereId,
      commandType:    "MESH",
      commandTargets: [meshId],
      private:        false
    });
  }
}


/**
 * TellSphere will notify all Meshes in the Sphere
 * @param sphereId
 */
export function tellSphere(sphereId, minConnections = 3) : CommandAPI {
  let sphere = Get.sphere(sphereId);
  if (!sphere) { throw "INVALID_SPHERE_ID" }

  let stoneIds = Object.keys(sphere.stones)
  let meshNetworks = [];
  for (let stoneId of stoneIds) {
    let meshId = sphere.stones[stoneId].config.meshNetworkId;
    if (meshId) {
      if (meshNetworks.indexOf(meshId) === -1) {
        meshNetworks.push(meshId);
      }
    }
  }

  if (meshNetworks.length > 0) {
    return new CommandAPI({
      commanderId:    xUtil.getUUID(),
      sphereId:       sphereId,
      commandType:    "MESH",
      commandTargets: meshNetworks,
      private:        false
    });
  }

}