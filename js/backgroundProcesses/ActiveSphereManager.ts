import { core } from "../core";
import { Util } from "../util/Util";
import { KEY_TYPES } from "../Enums";
import { act } from "@testing-library/react-native";

const ACTIVE_SPHERE_EXPIRATION_THRESHOLD = 5*60*1000; // 5 mins

class ActiveSphereManagerClass {

  timeSwitchedToBackground : number = 0;
  timeSwitchedToForeground : number = 0;
  timeActiveSphereSet : number = 0;

  userIsLoggedIn = false;

  onScreen() {
    if (new Date().valueOf() - this.timeSwitchedToBackground > ACTIVE_SPHERE_EXPIRATION_THRESHOLD) {
      this.updateActiveSphere();
    }
    this.timeSwitchedToForeground = new Date().valueOf();
  }

  toBackground() {
    this.timeSwitchedToBackground = new Date().valueOf();
  }

  setActiveSphere(sphereId: string) {
    core.store.dispatch({type:"SET_ACTIVE_SPHERE", data: { activeSphere: sphereId }});
    this.timeActiveSphereSet = new Date().valueOf();
  }

  clearActiveSphere() {
    core.store.dispatch({type:"CLEAR_ACTIVE_SPHERE"});
    this.timeActiveSphereSet = new Date().valueOf();
  }

  updateActiveSphere() {
    if (this.userIsLoggedIn === false) { return; }

    // set the active sphere if needed and setup the object variables.
    let state = core.store.getState();
    let currentActiveSphere = state.app.activeSphere;

    if (currentActiveSphere) {
      // we came from the background.
      if (this.timeSwitchedToForeground < this.timeSwitchedToBackground) {
        // we have been away from the foreground for more than 5 minutes
        if (new Date().valueOf() - this.timeSwitchedToBackground > ACTIVE_SPHERE_EXPIRATION_THRESHOLD) {
          // we have not set the active sphere in the last 5 minutes
          if (new Date().valueOf() - this.timeActiveSphereSet > ACTIVE_SPHERE_EXPIRATION_THRESHOLD) {
            this._updateActiveSphere();
          }
        }
      }
    }
    else {
      this._updateActiveSphere();
    }
  }

  _updateActiveSphere() {
    let state = core.store.getState();
    let activeSphereId = state.app.activeSphere;
    let activeSphere = state.spheres[activeSphereId];

    if (!activeSphere) {} // sphere is deleted
    else if (activeSphere.state.present === true) { // do not change active spheres if the sphere we're currently in is active.
      return;
    }
    let sphereIds = Object.keys(state.spheres).sort((sphereIdA,sphereIdB) => {
      let sphereA = state.spheres[sphereIdA];
      let sphereB = state.spheres[sphereIdB];
      if      (sphereA.state.present === true && sphereB.state.present !== true) {
        // prefer sphere A over sphere B, move A to position [0]
        return -1;
      }
      else if (sphereA.state.present !== true && sphereB.state.present === true) {
        // prefer sphere B over sphere A, move A to position [0]
        return 1;
      }

      if (sphereA.state.lastPresentTime && sphereB.state.lastPresentTime) {
        // if we have both times logged, the newest sphere goes to position [0]
        return sphereB.state.lastPresentTime - sphereA.state.lastPresentTime;
      }

      let accessA = getSphereAccessLevel(sphereA);
      let accessB = getSphereAccessLevel(sphereB);

      if (accessA != accessB) {
        // lowest access level goes to position 0;
        return accessA - accessB;
      }
      else {
        let amountOfCrownstonesA = Object.keys(sphereA.stones).length;
        let amountOfCrownstonesB = Object.keys(sphereB.stones).length;

        if (amountOfCrownstonesA != amountOfCrownstonesB) {
          // largest amount of crownstones goes on position [0]
          return amountOfCrownstonesB - amountOfCrownstonesA;
        }
        else {
          let amountOfRoomsA = Object.keys(sphereA.locations).length;
          let amountOfRoomsB = Object.keys(sphereB.locations).length;
          // largest amount of locations goes on position [0]
          return amountOfRoomsB - amountOfRoomsA;
        }
      }
    });

    // handle the case where we deleted a sphere that was active.
    if (sphereIds.length == 0) {
      this.clearActiveSphere();
    }
    else {
      this.setActiveSphere(sphereIds[0]);
    }
  }
}

function getSphereAccessLevel(sphere) {
  let keyMap = {};
  let sphereKeyIds = Object.keys(sphere.keys);
  for (let i = 0; i < sphereKeyIds.length; i++) {
    let key = sphere.keys[sphereKeyIds[i]];
    if (key.ttl === 0) {
      keyMap[key.keyType] = key.key;
    }
  }

  if (keyMap[KEY_TYPES.ADMIN_KEY]  !== undefined) { return 0;}
  if (keyMap[KEY_TYPES.MEMBER_KEY] !== undefined) { return 1;}
  if (keyMap[KEY_TYPES.BASIC_KEY]  !== undefined) { return 2;}
}

export const ActiveSphereManager = new ActiveSphereManagerClass()