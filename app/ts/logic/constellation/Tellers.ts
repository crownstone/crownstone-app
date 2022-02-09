import { LOG, LOGi } from "../../logging/Log";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { SessionManager } from "./SessionManager";
import { CommandAPI, CommandBroadcastAPI } from "./Commander";
import { Get } from "../../util/GetUtil";
import { TemporaryHandleMap } from "./TemporaryHandleMap";
import {Platform} from "react-native";

const DIRECT_CONNECTION_TIMEOUT = Platform.OS === 'ios' ? 20  : 20;
const CLAIM_BLUETOOTH_TIMEOUT   = Platform.OS === 'ios' ? 30  : 30;
const SHARED_CONNECTION_TIMEOUT = Platform.OS === 'ios' ? 10  : 15;
const MESH_CONNECTION_TIMEOUT   = Platform.OS === 'ios' ? 300 : 300;


export async function connectTo(handle, sphereId: string | null = null, timeoutSeconds = DIRECT_CONNECTION_TIMEOUT) : Promise<CommandAPI> {
  LOGi.constellation("Tellers: Starting a direct connection.", handle);

  if (sphereId) {
    TemporaryHandleMap.load(handle, sphereId);
  }

  let privateId = xUtil.getUUID();
  if (!sphereId) {
    let stoneData = MapProvider.stoneHandleMap[handle];
    if (stoneData) {
      sphereId = stoneData.sphereId;
    }
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


export async function claimBluetooth(handle, timeoutSeconds = CLAIM_BLUETOOTH_TIMEOUT) : Promise<CommandAPI> {
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
export function tell(handle: string | StoneData, timeoutSeconds = SHARED_CONNECTION_TIMEOUT, label: string = "UNKNOWN") : CommandAPI {
  if (typeof handle != 'string') { handle = handle.config.handle; }
  let sphereId = MapProvider.stoneHandleMap[handle]?.sphereId || null;

  // we do not check for handle and sphere here, this is done when the first command is loaded. This makes it so that the
  // error can be caught in the promise chain instead of before that.
  // if (!handle) { throw new Error("No handle yet."); }

  LOG.constellation("Tellers: Planning to tell", handle, label);
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
export function from(handle: string | StoneData, timeoutSeconds = SHARED_CONNECTION_TIMEOUT) : CommandAPI {
  return tell(handle, timeoutSeconds);
}


/**
 * TellSphere will notify all Meshes in the Sphere
 * @param sphereId
 */
export function tellSphere(sphereId, timeoutSeconds = MESH_CONNECTION_TIMEOUT, minConnections = 3) : CommandAPI {
  LOGi.constellation("Telling sphere", sphereId, minConnections);

  let sphere = Get.sphere(sphereId);
  if (!sphere) { throw new Error("INVALID_SPHERE_ID"); }


  return new CommandAPI({
    commanderId:    xUtil.getUUID(),
    sphereId:       sphereId,
    commandType:    "MESH",
    commandTargets: [sphereId],
    private:        false,
    minConnections: minConnections,
    timeout:        timeoutSeconds
  });
}

export function broadcast(sphereId) : CommandBroadcastAPI {
  return new CommandBroadcastAPI({
    commanderId:    xUtil.getUUID(),
    sphereId:       sphereId,
    commandType:    "BROADCAST",
    commandTargets: ["BROADCAST"],
    timeout:        0,
  })
}