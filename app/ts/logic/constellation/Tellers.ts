import { LOG, LOGi } from "../../logging/Log";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { SessionManager } from "./SessionManager";
import { CommandAPI } from "./Commander";
import { Get } from "../../util/GetUtil";

export async function connectTo(handle, timeoutSeconds = 20) : Promise<CommandAPI> {
  LOGi.constellation("Tellers: Starting a direct connection.", handle);

  let privateId = xUtil.getUUID();
  let stoneData = MapProvider.stoneHandleMap[handle];
  let sphereId = null;
  if (stoneData) {
    sphereId = stoneData.sphereId;
  }

  try {
    await SessionManager.request(handle, privateId, true, timeoutSeconds);
  }
  catch (err) {
    SessionManager.revokeRequest(handle, privateId);
    throw err;
  }
  let commander = new CommandAPI({
    commanderId:    privateId,
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        true,
    timeout:        timeoutSeconds
  });

  commander.broker.loadSession(handle);
  return commander;
}


export async function claimBluetooth(handle, timeoutSeconds = 30) : Promise<CommandAPI> {
  LOGi.constellation("Tellers: Claiming BLE for", handle);

  let privateId = xUtil.getUUID();
  let stoneData = MapProvider.stoneHandleMap[handle];
  let sphereId = null;
  if (stoneData) {
    sphereId = stoneData.sphereId;
  }
  try {
    await SessionManager.claimSession(handle, privateId, timeoutSeconds);
  }
  catch (err) {
    SessionManager.revokeRequest(handle, privateId);
    throw err;
  }
  let commander = new CommandAPI({
    commanderId:    privateId,
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        true,
    timeout:        timeoutSeconds
  });

  commander.broker.loadSession(handle);
  return commander;
}

/**
 * The tellers are functions which return a chainable command API to a single Crownstone.
 * This will also be able to possibly use a hub to propagate these commands.
 */
export function tell(handle: string | StoneData, timeoutSeconds = 10) : CommandAPI {
  if (typeof handle != 'string') { handle = handle.config.handle; }
  let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId || null;

  // we do not check for handle and sphere here, this is done when the first command is loaded. This makes it so that the
  // error can be caught in the promise chain instead of before that.

  LOG.constellation("Tellers: Planning to tell", handle);
  return new CommandAPI({
    commanderId:    xUtil.getUUID(),
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        false,
    timeout:        timeoutSeconds
  });
}

/**
 * This does exactly the same as tell, it just sounds nicer when we use get methods.
 * from(stone).getFirmwareVersion()
 * @param handle
 */
export function from(handle: string | StoneData, timeoutSeconds = 10) : CommandAPI {
  return tell(handle, timeoutSeconds);
}

/**
 * @param meshId
 * @param minimalConnections
 */
export function tellMesh(meshId, timeoutSeconds = 300, minConnections = 3) : CommandAPI {
  LOGi.constellation("Telling the meshnetwork...", meshId, minConnections);
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
      private:        false,
      minConnections: minConnections,
      timeout:        timeoutSeconds
    });
  }
}


/**
 * TellSphere will notify all Meshes in the Sphere
 * @param sphereId
 */
export function tellSphere(sphereId, timeoutSeconds = 300, minConnections = 3) : CommandAPI {
  LOGi.constellation("Telling sphere", sphereId, minConnections);

  let sphere = Get.sphere(sphereId);
  if (!sphere) { throw new Error("INVALID_SPHERE_ID"); }

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

  // if there are no known mesh networks, assume that the phone just doenst know them and treat "null" as a mesh network.
  // null is the default networkId if a stone has no mesh network.
  if (meshNetworks.length == 0) {
    meshNetworks.push(null);
  }

  return new CommandAPI({
    commanderId:    xUtil.getUUID(),
    sphereId:       sphereId,
    commandType:    "MESH",
    commandTargets: meshNetworks,
    private:        false,
    minConnections: minConnections,
    timeout:        timeoutSeconds
  });
}