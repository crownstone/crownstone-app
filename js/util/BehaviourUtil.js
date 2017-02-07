import { BluenetPromises, BEHAVIOUR_TYPE_TO_INTENT } from '../native/Proxy';
import { BleUtil } from '../native/BleUtil';
import { Scheduler } from '../logic/Scheduler';
import { LOG } from '../logging/Log';

export const BehaviourUtil = {

  /**
   * Trigger the behaviour for all crownstones in a certain location
   * @param { Object } store            // redux store
   * @param { String } sphereId         // ID of sphere
   * @param { String } behaviourType    // type of behaviour to be used in the logging and switching intent
   * @param { String } locationId       // ID of location to get the stones from
   * @param { Object } callbacks        // hooks for the enacting of the behaviour.
   *                                        {
   *                                          onCancelled: function(sphereId, stoneId),               // triggered if the behaviour is not used
   *                                          onTrigger: function(sphereId, stoneId),                 // triggered when the behaviour is executed
   *                                          onSchedule: function(sphereId, stoneId, abortSchedule)  // triggered if the behaviour is scheduled
   *                                        }
   */
  enactBehaviourInLocation: function(store, sphereId, locationId, behaviourType, callbacks = {}) {
    // turn on crownstones in room
    let state = store.getState();
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);

    stoneIds.forEach((stoneId) => {
      // for each stone in sphere select the behaviour we want to copy into the keep Alive
      let stone = sphere.stones[stoneId];
      if (stone.config.locationId !== locationId)
        return;

      this.enactBehaviour(store, sphereId, stoneId, behaviourType, callbacks);
    });
  },


  /**
   * Trigger the behaviour for all crownstones in a sphere
   * @param { Object } store            // redux store
   * @param { String } sphereId         // ID of sphere to get the stones from
   * @param { String } behaviourType    // type of behaviour to be used in the logging and switching intent
   * @param { Object } callbacks        // hooks for the enacting of the behaviour.
   *                                        {
   *                                          onCancelled: function(sphereId, stoneId),               // triggered if the behaviour is not used
   *                                          onTrigger: function(sphereId, stoneId),                 // triggered when the behaviour is executed
   *                                          onSchedule: function(sphereId, stoneId, abortSchedule)  // triggered if the behaviour is scheduled
   *                                        }

   */
  enactBehaviourInSphere: function(store, sphereId, behaviourType, callbacks = {}) {
    let state = store.getState();
    let sphere = state.spheres[sphereId];
    let stoneIds = Object.keys(sphere.stones);

    stoneIds.forEach((stoneId) => {
      this.enactBehaviour(store, sphereId, stoneId, behaviourType, callbacks = {})
    });
  },


  /**
   * Trigger behaviour for a certain stone in a sphere
   * @param { Object } store            // redux store
   * @param { String } sphereId         // ID of sphere
   * @param { String } behaviourType    // type of behaviour to be used in the logging and switching intent
   * @param { String } stoneId          // ID of stone
   * @param { Object } callbacks        // hooks for the enacting of the behaviour.
   *                                        {
   *                                          onCancelled: function(sphereId, stoneId),               // triggered if the behaviour is not used
   *                                          onTrigger: function(sphereId, stoneId),                 // triggered when the behaviour is executed
   *                                          onSchedule: function(sphereId, stoneId, abortSchedule)  // triggered if the behaviour is scheduled
   *                                        }
   */
  enactBehaviour: function(store, sphereId, stoneId, behaviourType, callbacks = {}) {
    let state = store.getState();
    let sphere = state.spheres[sphereId];
    let stone = sphere.stones[stoneId];
    let element = this.getElement(sphere, stone);
    let behaviour = element.behaviour[behaviourType];

    this.enactBehaviourCore(store, sphere, sphereId, behaviour, behaviourType, stone, stoneId, element, callbacks);
  },


  /**
   * Trigger the behaviour for a certain stone in a sphere. This method is where the actual triggering is done.
   *
   *
   * @param { Object } store            // redux store
   * @param { Object } sphere           // specific sphere from the state of the store
   * @param { String } sphereId         // ID of sphere
   * @param { Object } behaviour        // behaviour object from element object
   * @param { String } behaviourType    // type of behaviour to be used in the logging and switching intent
   * @param { Object } stone            // stone object from sphere
   * @param { String } stoneId          // ID of stone
   * @param { Object } element          // the appliance or element, depending on if the stone has an appliance. This is used for behaviour
   * @param { Object } callbacks        // hooks for the enacting of the behaviour.
   *                                        {
   *                                          onCancelled: function(sphereId, stoneId),               // triggered if the behaviour is not used
   *                                          onTrigger: function(sphereId, stoneId),                 // triggered when the behaviour is executed
   *                                          onSchedule: function(sphereId, stoneId, abortSchedule)  // triggered if the behaviour is scheduled
   *                                        }
   */
  enactBehaviourCore: function(store, sphere, sphereId, behaviour, behaviourType, stone, stoneId, element, callbacks = {}) {
    // we set the state regardless of the current state since it may not be correct in the background.
    if (behaviour.active && stone.config.handle) {
      // setup the trigger method.
      let changeCallback = () => {
        // if the device is supposed to go on and it is only allowed to go on when it's dark, check if its dark.
        if (this.allowBehaviourBasedOnDarkOutside(sphere, behaviour, element) === false) {
          callbacks.onCancelled(sphereId, stoneId);
          return;
        }

        if (callbacks && callbacks.onTrigger && typeof callbacks.onTrigger === 'function') {
          callbacks.onTrigger(sphereId, stoneId);
        }

        LOG.info("BehaviourUtil: FIRING ", behaviourType, " event for ", element.config.name, stoneId);

        // if we need to switch, configure the data to update the store with.
        let data = {state: behaviour.state};
        if (behaviour.state === 0) {
          data.currentUsage = 0;
        }

        let proxy = BleUtil.getProxy(stone.config.handle);
        proxy.perform(BluenetPromises.setSwitchState, [behaviour.state, BEHAVIOUR_TYPE_TO_INTENT[behaviourType]])
          .then(() => {
            store.dispatch({
              type: 'UPDATE_STONE_STATE',
              sphereId: sphereId,
              stoneId: stoneId,
              data: data
            });
          })
          .catch((err) => {
            LOG.error("BehaviourUtil: Could not fire", behaviourType, ' due to ', err);
          })
      };

      if (behaviour.delay > 0) {
        // use scheduler
        let abortSchedule = Scheduler.scheduleCallback(changeCallback, behaviour.delay * 1000);
        if (callbacks && callbacks.onSchedule && typeof callbacks.onSchedule === 'function') {
          callbacks.onSchedule(sphereId, stoneId, abortSchedule);
        }
      }
      else {
        changeCallback();
      }
    }
    else {
      if (callbacks && callbacks.onCancelled && typeof callbacks.onCancelled === 'function') {
        callbacks.onCancelled(sphereId, stoneId);
      }
    }
  },


  /**
   * If the stone has an appliance, return that appliance, otherwise return the stone. This gets you the item that
   * contains the active behaviour
   * @param sphere
   * @param stone
   * @returns {*}
   */
  getElement: function (sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  },


  /**
   * Check if you need to switch this device based on the time of sunrise and sunset
   * @param sphere
   * @param behaviour
   * @param element
   * @returns {boolean}
   */
  allowBehaviourBasedOnDarkOutside: function(sphere, behaviour, element) {
    // if the device is supposed to go on and it is only allowed to go on when it's dark, check if its dark.
    if (behaviour.state > 0 && element.config.onlyOnWhenDark === true) {
      let now = new Date().valueOf();
      // the time in our rotterdam office
      let latitude = sphere.config.latitude || 51.923611570463152;
      let longitude = sphere.config.longitude || 4.4667693378575288;
      let times = SunCalc.getTimes(new Date(), latitude, longitude);

      // its light outside between the end of the sunrise and the start of the sunset.
      if (now > times.sunriseEnd.valueOf() && now < times.sunsetStart.valueOf()) {
        // skip the trigger for this item because it is light outside.
        return false;
      }
    }
    return true;
  }
};