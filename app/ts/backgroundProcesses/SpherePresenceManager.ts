import { MapProvider } from "./MapProvider";
import { core } from "../Core";
import { CLOUD } from "../cloud/cloudAPI";

class SpherePresenceManagerClass {

  unsubscribe;
  wentToBackground = true;

  init() {
    this.unsubscribe = core.eventBus.on("AppStateChange", (state) => {
      if (state === "active") {
        if (this.wentToBackground) {
          CLOUD.syncUsers();
          this.wentToBackground = false;
        }
      }
      else if (state === "background") {
        this.wentToBackground = true;
      }
    });
  }

  /**
   * This is from an SSE event.
   * @param event
   */
  handlePresenceEvent(event : PresenceSphereEvent | PresenceLocationEvent) {
    let localSphereId = MapProvider.cloud2localMap.spheres[event.sphere.id];
    switch (event.subType) {
      case "enterSphere":
        break;
      case "exitSphere":
        // remove user from all locations
        core.store.dispatch({type: "REMOVE_USER_FROM_ALL_LOCATIONS", sphereId: localSphereId, userId: event.user.id});
        break;
      case "enterLocation":
        let localLocationId = MapProvider.cloud2localMap.locations[event.location?.id];
        // add user to location, remove from others.
        core.store.dispatch({type: "REMOVE_USER_FROM_ALL_LOCATIONS", sphereId: localSphereId, userId: event.user.id});
        core.store.dispatch({type: "USER_ENTER_LOCATION", sphereId: localSphereId, locationId: localLocationId, data: {userId: event.user.id}});
        break;
      case "exitLocation":
        break;
    }
  }
}


export const SpherePresenceManager = new SpherePresenceManagerClass();
