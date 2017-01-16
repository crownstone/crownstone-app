import { Bluenet, BleActions, NativeBus } from './Proxy';
import { BleUtil } from './BleUtil';
import { Scheduler } from './../logic/Scheduler';
import { LOG, LOGDebug, LOGError, LOGBle } from '../logging/Log'
import { TYPES } from '../router/store/reducers/stones'



class RoomPresenceTrackerClass {
  constructor() {
    this.roomStates = {};
  }

  /**
   * this will clear out all pending timeouts for triggering because of exit room
   * @param store
   * @param sphereId
   * @param locationId
   */
  enterRoom(store, sphereId, locationId) {
    // cleanup pending room exit events
    if (this.roomStates[sphereId] && this.roomStates[sphereId][locationId]) {
      let stoneIds = Object.keys(this.roomStates[sphereId][locationId]);
      stoneIds.forEach((stoneId) => {
        if (this.roomStates[sphereId][locationId][stoneId] !== undefined) {
          this.roomStates[sphereId][locationId][stoneId]();
          this.roomStates[sphereId][locationId][stoneId] = undefined;
        }
      });
      this.roomStates[sphereId][locationId] = {};
    }

    // turn on crownstones in room
    let state = store.getState();
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);
    stoneIds.forEach((stoneId) => {
      // for each stone in sphere select the behaviour we want to copy into the keep Alive
      let stone = sphere.stones[stoneId];
      if (stone.config.locationId !== locationId)
        return;

      let element = this._getElement(sphere, stone);
      let behaviour = element.behaviour[TYPES.ROOM_ENTER];

      // we set the state regardless of the current state since it may not be correct in the background.
      if (behaviour.active && stone.config.handle) {
        this._handleTrigger(store, behaviour, stoneId, locationId, sphereId);
      }
    });
  }

  exitRoom(store, sphereId, locationId) {
    if (!this.roomStates[sphereId]) {
      this.roomStates[sphereId] = {};
    }

    if (!this.roomStates[sphereId][locationId]) {
      this.roomStates[sphereId][locationId] = {};
    }

    let state = store.getState();
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);
    stoneIds.forEach((stoneId) => {
      // for each stone in sphere select the behaviour we want to copy into the keep Alive
      let stone = sphere.stones[stoneId];
      if (stone.config.locationId !== locationId)
        return;

      let element = this._getElement(sphere, stone);
      let behaviour = element.behaviour[TYPES.ROOM_EXIT];

      // we set the state regardless of the current state since it may not be correct in the background.
      if (behaviour.active && stone.config.handle) {
        // cancel the previous timeout
        if (this.roomStates[sphereId][locationId][stoneId] !== undefined) {
          this.roomStates[sphereId][locationId][stoneId]();
          this.roomStates[sphereId][locationId][stoneId] = undefined;
        }
        this._handleTrigger(store, behaviour, stoneId, locationId, sphereId);
      }
    });
  }


  _handleTrigger(store, behaviour, stoneId, locationId, sphereId) {
    let changeCallback = () => {
      let state = store.getState();
      let stone = state.spheres[sphereId].stones[stoneId];
      if (this.roomStates && this.roomStates[sphereId] && this.roomStates[sphereId][locationId]) {
        this.roomStates[sphereId][locationId][stoneId] = undefined;
      }
      // if we need to switch:
      if (behaviour.state !== stone.state.state) {
        this._applySwitchState(store, behaviour.state, stone, stoneId, sphereId);
      }
    };

    if (behaviour.delay > 0) {
      // use scheduler
      if (this.roomStates && this.roomStates[sphereId] && this.roomStates[sphereId][locationId]) {
        this.roomStates[sphereId][locationId][stoneId] = Scheduler.scheduleCallback(changeCallback, behaviour.delay * 1000);
      }
    }
    else {
      changeCallback();
    }
  }

  _applySwitchState(store, newState, stone, stoneId, sphereId) {
    let data = {state: newState};
    if (newState === 0) {
      data.currentUsage = 0;
    }
    let proxy = BleUtil.getProxy(stone.config.handle);
    proxy.perform(BleActions.setSwitchState, [newState])
      .then(() => {
        store.dispatch({
          type: 'UPDATE_STONE_STATE',
          sphereId: sphereId,
          stoneId: stoneId,
          data: data
        });
      })
      .catch((err) => {
        LOGError("COULD NOT SET STATE", err);
      })
  }


  // TODO: remove duplicates
  _getElement(sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  }
}

export const RoomTracker = new RoomPresenceTrackerClass();