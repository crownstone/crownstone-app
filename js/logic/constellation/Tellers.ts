import { BroadcastCommandManager } from "../bchComponents/BroadcastCommandManager";
import { BleCommandLoader } from "./BleCommandQueue";
import { SessionManager } from "./SessionManager";
import { xUtil } from "../../util/StandAloneUtil";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { Collector } from "./Collector";
import { core } from "../../core";


async function connectTo(handle, timeoutSeconds = 30) : Promise<CommandAPI> {
  let privateId = xUtil.getUUID();
  let stoneData = MapProvider.stoneHandleMap[handle];
  let sphereId = null;
  if (stoneData) {
    sphereId = stoneData.sphereId;
  }
  await SessionManager.request(handle, privateId, true, timeoutSeconds);
  return new CommandAPI({
    commanderId:    privateId,
    sphereId:       sphereId,
    commandType:    "DIRECT",
    commandTargets: [handle],
    private:        true
  });
}

// /**
//  * The tellers are functions which return a chainable command API to a single Crownstone.
//  * This will also be able to possibly use a hub to propagate these commands.
//  */
// function tell(handle: string | StoneData) : CommandAPI {
//   return
// }
//
//
// /**
//  * @param meshId
//  * @param minimalConnections
//  */
// function tellMesh(meshId, minConnections = 3) : CommandAPI {
//
// }
//
//
// function tellNearby(minConnections = 3) : CommandAPI {
//
// }
//
//
// /**
//  * TellSphere will notify all Meshes in the Sphere
//  * @param sphereId
//  */
// function tellSphere(sphereId, minConnections = 3) : CommandAPI {
//
//
// }