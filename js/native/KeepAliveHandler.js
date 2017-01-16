import { Scheduler } from '../logic/Scheduler';
import { LOG, LOGDebug, LOGError } from '../logging/Log'
import { KEEPALIVE_INTERVAL, KEEPALIVE_REPEAT_ATTEMPTS, KEEPALIVE_REPEAT_INTERVAL } from '../ExternalConfig';
import { BleActions } from './Proxy';
import { BleUtil } from './BleUtil';
import { canUseIndoorLocalizationInSphere, getUserLevelInSphere } from '../util/dataUtil'

import { stoneTypes, TYPES } from '../router/store/reducers/stones'
const TRIGGER_ID = 'KEEP_ALIVE_HANDLER';

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

    LOG('KeepAliveHandler: Starting KeepAlive call');

    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      LOG('KeepAliveHandler: Starting KeepAlive round for sphere:', sphere.config.name);

      // check every sphere where we are present. Usually this is only one of them!!
      let useRoomLevel = canUseIndoorLocalizationInSphere(state, sphereId);
      let userLevelInSphere = getUserLevelInSphere(state, sphereId);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        // for each stone in sphere select the behaviour we want to copy into the keep Alive
        let stone = sphere.stones[stoneId];

        let keepAliveId = (Math.floor(Math.random()*1e6)).toString(36);

        if (stone.config.type !== stoneTypes.guidestone) {
          let element = this._getElement(sphere, stone);
          let behaviourRoomExit = element.behaviour[TYPES.ROOM_EXIT];
          let behaviourHomeExit = element.behaviour[TYPES.HOME_EXIT];
          let behaviourAway = element.behaviour[TYPES.AWAY];

          let behaviour = undefined;

          // if the home exit is not defined, the room exit and the away should take its place. They are not in the room either!
          if      (behaviourHomeExit.active === true)                   { behaviour = behaviourHomeExit; }
          else if (behaviourRoomExit.active === true && useRoomLevel)   { behaviour = behaviourRoomExit; }
          else if (behaviourAway.active === true && !useRoomLevel)      { behaviour = behaviourAway;     }

          if (stone.config.handle && stone.config.disabled === false) {
            this._performKeepAliveForStone(stone, behaviour, userLevelInSphere, element, keepAliveId);
          }
          else if (stone.config.disabled === true) {
            LOG('KeepAliveHandler: (' + keepAliveId + ') skip KeepAlive stone is disabled', stoneId);
          }
        }
      });
    });
  }

  _performKeepAliveForStone(stone, behaviour, userLevelInSphere, element, keepAliveId, attempt = 0) {
    LOG('KeepAliveHandler: (' + keepAliveId + ') Performing keep Alive to stone handle', stone.config.handle);
    let proxy = BleUtil.getProxy(stone.config.handle);

    // this function will retry the keepAlive if it fails.
    let retry = () => {
      LOG('KeepAliveHandler: (' + keepAliveId + ') Retrying guest keepAlive to ', stone.config.handle);
      Scheduler.scheduleCallback(() => {
        this._performKeepAliveForStone(stone, behaviour, userLevelInSphere, element, keepAliveId, attempt + 1);
      }, KEEPALIVE_REPEAT_INTERVAL, 'keepAlive_attempt_' + attempt + '_' + stone.config.handle)
    };

    // guests do not send a state, they just prolong the existing keepAlive.
    if (userLevelInSphere === 'guest') {
      proxy.perform(BleActions.keepAlive)
        .then(() => {
          LOG('KeepAliveHandler: (' + keepAliveId + ') guest KeepAlive Successful to ', element.config.name, element.config.handle);
        })
        .catch((err) => {
          LOGError('KeepAliveHandler: (' + keepAliveId + ') ATTEMPT ' + attempt + ', COULD NOT PERFORM KEEP ALIVE WITHOUT STATE TO ', stone.config.name, stone.config.handle, 'DUE TO ', err);
          if (attempt < KEEPALIVE_REPEAT_ATTEMPTS) { retry(); }
        })
    }
    else {
      // determine what to send
      let changeState = false;
      let newState = 0;
      let timeout = 2.5*KEEPALIVE_INTERVAL;
      // if we have behaviour, send it to the crownstone.
      if (behaviour !== undefined) {
        changeState = true;
        newState = behaviour.state;
        timeout = Math.max(timeout, behaviour.delay);
      }

      proxy.perform(BleActions.keepAliveState, [changeState, newState, timeout]) // the max in time is so that it will not turn off before the next interval.
        .then(() => {
          LOG('KeepAliveHandler: (' + keepAliveId + ') keepAliveState Successful to ', element.config.name, element.config.handle);
        })
        .catch((err) => {
          LOGError('KeepAliveHandler: (' + keepAliveId + ') ATTEMPT ' + attempt + ', COULD NOT PERFORM KEEPALIVE AS', userLevelInSphere, 'TO ', stone.config.name, stone.config.handle, 'DUE TO ', err);
          if (attempt < KEEPALIVE_REPEAT_ATTEMPTS) { retry(); }
        })
    }
  }

  // TODO: remove duplicate versions of this method
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




