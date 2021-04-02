import { core } from "../core";


export const Get = {

  activeSphere() : SphereData | null {
    let state = core.store.getState();
    let activeSphere = state?.app?.activeSphere || null;
    if (activeSphere) { return state.spheres[activeSphere] || null; }
    return null;
  },

  sphere(sphereId: string) : SphereData | null {
    let state = core.store.getState();
    return state?.spheres?.[sphereId] || null;
  },

  sphereId(stoneId: string) : string | null {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    for (let sphereId of sphereIds) {
      if (state.spheres[sphereId].stones[stoneId] !== undefined) {
        return sphereId;
      }
    }
    return null;
  },

  hub(sphereId: string, hubId: string) : HubData | null {
    let sphere = Get.sphere(sphereId);
    return sphere?.hubs?.[hubId] || null;
  },

  stone(sphereId: string, stoneId: string) : StoneData | null {
    let sphere = Get.sphere(sphereId);
    return sphere?.stones?.[stoneId] || null;
  },

  location(sphereId: string, locationId: string) : LocationData | null {
    let sphere = Get.sphere(sphereId);
    return sphere?.locations?.[locationId] || null;
  }
}