import { Scheduler } from '../logic/Scheduler';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { KEEPALIVE_INTERVAL } from '../ExternalConfig';
import { BleActions } from './Proxy';
import { BleUtil } from './BleUtil';
import { canUseIndoorLocalizationInSphere, getUserLevelInSphere } from '../util/dataUtil'

import { TYPES } from '../router/store/reducers/stones'
const TRIGGER_ID = "KEEP_ALIVE_HANDLER";

class KeepAliveHandlerClass {
  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.state = {};
  }

  loadStore(store) {
    LOG('LOADED STORE KeepAliveHandler', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      this.init();

    }
  }

  init() {
    if (this._initialized === false) {
      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: KEEPALIVE_INTERVAL});
      Scheduler.loadCallback(TRIGGER_ID, this.keepAlive.bind(this), true);
      this._initialized = true;
    }
  }


  fireTrigger() {
    Scheduler.fireTrigger(TRIGGER_ID);
  }


  keepAlive() {
    const state = this.store.getState();
    let sphereIds = Object.keys(state.spheres);

    LOG("Starting KeepAlive call");

    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      LOG("Starting KeepAlive round for sphere:", sphere.config.name);

      // check every sphere where we are present. Usually this is only one of them!!
      let useRoomLevel = canUseIndoorLocalizationInSphere(state, sphereId);
      let userLevelInSphere = getUserLevelInSphere(state, sphereId);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        // for each stone in sphere select the behaviour we want to copy into the keep Alive
        let stone = sphere.stones[stoneId];
        let element = this._getElement(sphere, stone);
        let behaviourRoomExit = element.behaviour[TYPES.ROOM_EXIT];
        let behaviourHomeExit = element.behaviour[TYPES.HOME_EXIT];
        let behaviourAway = element.behaviour[TYPES.AWAY];

        let behaviour = undefined;

        // if the home exit is not defined, the room exit and the away should take its place. They are not in the room either!
        if      (behaviourHomeExit.active)                   { behaviour = behaviourHomeExit; }
        else if (behaviourRoomExit.active && useRoomLevel)   { behaviour = behaviourRoomExit; }
        else if (behaviourAway.active)                       { behaviour = behaviourAway;     }

        if (stone.config.handle && stone.config.disabled === false) {
          LOG("Performing stateless_Keepalive to stone.config.handle", stone.config.handle)
          let proxy = BleUtil.getProxy(stone.config.handle);

          if (userLevelInSphere === 'guest' || behaviour === undefined) {
            LOG("Performing stateless_Keepalive");
            proxy.perform(BleActions.keepAlive)
              .then(() => {
                LOG("KeepAlive Successful to ", element.config.name, element.config.handle);
              })
              .catch((err) => {
                LOGError("COULD NOT PERFORM KEEP ALIVE WITHOUT STATE TO ", stone.config.name, stone.config.handle, "DUE TO ", err);
              })
          }
          else {
            proxy.perform(BleActions.keepAliveState, behaviour.state, Math.max(1.5*KEEPALIVE_INTERVAL, behaviour.delay)) // the max in time is so that it will not turn off before the next interval.
              .then(() => {
                LOG("keepAliveState Successful to ", element.config.name, element.config.handle);
              })
              .catch((err) => {
                LOGError("COULD NOT PERFORM KEEPALIVE AS", userLevelInSphere, "TO ", stone.config.name, stone.config.handle, "DUE TO ", err);
              })
          }
        }
        else if (stone.config.disabled === true) {
          LOG("IgnoreKeepalive_stoneDisabled", stoneId);
        }
      });
    });
  }


  // TODO: remove duplicate
  _getElement(sphere, stone) {
    if (stone.config.applianceId) {
      return sphere.appliances[stone.config.applianceId];
    }
    else {
      return stone;
    }
  }

}

export const KeepAliveHandler = new KeepAliveHandlerClass();




