import { connectTo } from "../../logic/constellation/Tellers";
import { CommandAPI } from "../../logic/constellation/Commander";
import { MapProvider } from "../MapProvider";
import { TESTING_SPHERE_ID } from "./DevAppState";
import { FocusManager } from "./FocusManager";

class ConnectionManagerClass {
  bleConnectionTimeout = null;
  handle: string = null;
  api: CommandAPI = null;

  constructor() {}

  setDisconnectTimeout() {
    if (this.bleConnectionTimeout !== null) {
      clearTimeout(this.bleConnectionTimeout);
    }
    this.bleConnectionTimeout = setTimeout(() => { this.disconnect() }, 5000);
  }

  async connect(handle: string, sphereId: string) : Promise<CommandAPI> {
    // Constellation depends on the MapProvider for ID resolving. This should cover that case along with the same code in the stoneSelector update method.
    // The check here is required since setup might be done in the views using this class.
    if (sphereId === TESTING_SPHERE_ID) {
      MapProvider.stoneHandleMap[handle] = {
        id: null,
        cid: 0,
        handle: handle,
        name: "devStone",
        sphereId: TESTING_SPHERE_ID,
        stone: {},
        stoneConfig: {},
      }
    }
    else {
      if (MapProvider.stoneHandleMap[handle]?.sphereId === TESTING_SPHERE_ID) {
        MapProvider.refreshAll();
      }
    }

    let activeSphereId = null;
    if (FocusManager.crownstoneMode === 'verified') {
      activeSphereId = sphereId;
    }

    if (this.api !== null) {
      return this.api;
    }
    this.handle = handle;
    this.api = await connectTo(handle, activeSphereId);
    return this.api;
  }

  async disconnect() {
    if (this.api) {
      await this.api.end();
      this.api = null;
    }
  }

}

export const ConnectionManager = new ConnectionManagerClass();