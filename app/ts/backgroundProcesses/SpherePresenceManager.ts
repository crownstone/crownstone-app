import { MapProvider } from "./MapProvider";
import { core } from "../Core";
import { CLOUD } from "../cloud/cloudAPI";
import {ActiveSphereManager} from "./ActiveSphereManager";
import { LOGd } from "../logging/Log";

class SpherePresenceManagerClass {

  unsubscribe;
  wentToBackground = true;

  userId : string;

  init() {
    this.userId = core.store.getState().user.userId;

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

    core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.updateActiveSphere) {
        CLOUD.syncUsers();
      }
    });

    CLOUD.syncUsers();
  }

  /**
   * This is from an SSE event.
   * @param event
   */
  handlePresenceEvent(event : PresenceSphereEvent | PresenceLocationEvent) {
    // do not update the user position based on SSE events if this is about you.
    // The position of the logged-in user is updated by the app itself, not from external sources.
    if (event?.user?.id === this.userId) { return; }

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
