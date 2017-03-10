import { BehaviourUtil } from '../util/BehaviourUtil';
import { LOG } from '../logging/Log'
import { TYPES } from '../router/store/reducers/stones'



class RoomPresenceTrackerClass {
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



  switchRoom(store, sphereId, oldLocationId, newLocationId) {

  }


  /**
   * Clean up and cancel pending actions for this room, fire the enter/exit event
   * @param store
   * @param sphereId
   * @param locationId
   * @param behaviourType
   * @param [ bleController ]
   * @private
   */
  _triggerRoomEvent( store, sphereId, locationId, behaviourType, bleController?) {
    // fire TYPES.ROOM_ENTER on crownstones in room
    BehaviourUtil.enactBehaviourInLocation(store, sphereId, locationId, behaviourType, bleController);
  }

}

export const RoomTracker = new RoomPresenceTrackerClass();