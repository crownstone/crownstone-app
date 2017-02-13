import { BehaviourUtil } from '../util/BehaviourUtil';
import { LOG } from '../logging/Log'
import { TYPES } from '../router/store/reducers/stones'



class RoomPresenceTrackerClass {
  constructor() {
    this.roomStates = {};
  }

  /**
   * This will apply the behaviour for each stone in this room on entering the room.
   * @param store
   * @param sphereId
   * @param locationId
   */
  enterRoom(store, sphereId, locationId) {
    LOG.info("RoomTracker: Enter room: ", locationId, ' in sphere: ', sphereId);
    this._triggerRoomEvent(store, sphereId, locationId, TYPES.ROOM_ENTER);
  }

  /**
   * This will apply the behaviour for each stone in this room on leaving the room.
   * @param store
   * @param sphereId
   * @param locationId
   */
  exitRoom(store, sphereId, locationId) {
    LOG.info("RoomTracker: Exit room: ", locationId, ' in sphere: ', sphereId);
    this._triggerRoomEvent(store, sphereId, locationId, TYPES.ROOM_EXIT);
  }


  /**
   * Clean up and cancel pending actions for this room, fire the enter/exit event
   * @param store
   * @param sphereId
   * @param locationId
   * @param behaviourType
   * @private
   */
  _triggerRoomEvent( store, sphereId, locationId, behaviourType) {
    // clean up any pending room enter/exit triggers. Only delayed triggers can be pending.
    this._cleanupPendingRoomTriggers(sphereId, locationId);

    // generate the callbacks to keep track of the state in rooms.
    let callbacks = {
      // when we schedule the triggering, we store the abort method in case we leave or exit the room again.
      onSchedule: (sphereId, stoneId, abortSchedule) => {
        this.roomStates[sphereId][locationId][stoneId] = abortSchedule;
      },

      // if there is an existing pending trigger, clear it before we fire the next one.
      onTrigger: (sphereId, stoneId) => {
        if (this.roomStates && this.roomStates[sphereId] && this.roomStates[sphereId][locationId]) {
          this.roomStates[sphereId][locationId][stoneId]();
          this.roomStates[sphereId][locationId][stoneId] = undefined;
        }
      }
    };

    // fire TYPES.ROOM_ENTER on crownstones in room
    BehaviourUtil.enactBehaviourInLocation(store, sphereId, locationId, behaviourType, undefined, callbacks);
  }


  /**
   * Update our index we use the keep track of pending actions. We also clear any pending actions for this specific
   * Sphere/room.
   * @param sphereId
   * @param locationId
   * @private
   */
  _cleanupPendingRoomTriggers(sphereId, locationId) {
    if (!this.roomStates[sphereId]) {
      this.roomStates[sphereId] = {};
    }

    if (!this.roomStates[sphereId][locationId]) {
      this.roomStates[sphereId][locationId] = {};
    }

    // cleanup pending room trigger events
    let stoneIds = Object.keys(this.roomStates[sphereId][locationId]);
    stoneIds.forEach((stoneId) => {
      if (this.roomStates[sphereId][locationId][stoneId] !== undefined) {

        // if this is a function to cancel a pending scheduled action, clear it.
        if (typeof this.roomStates[sphereId][locationId][stoneId] === 'function') {
          this.roomStates[sphereId][locationId][stoneId]();
        }

        this.roomStates[sphereId][locationId][stoneId] = undefined;
      }
    });
    this.roomStates[sphereId][locationId] = {};
  }
}

export const RoomTracker = new RoomPresenceTrackerClass();