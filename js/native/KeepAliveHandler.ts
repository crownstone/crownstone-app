import { Scheduler } from '../logic/Scheduler';
import { BehaviourUtil } from '../util/BehaviourUtil';
import { LOG } from '../logging/Log'
import { KEEPALIVE_INTERVAL, KEEPALIVE_REPEAT_ATTEMPTS, KEEPALIVE_REPEAT_INTERVAL } from '../ExternalConfig';
import { BluenetPromises } from './Proxy';
import { BleUtil, BatchCommand } from './BleUtil';
import { canUseIndoorLocalizationInSphere, getUserLevelInSphere } from '../util/DataUtil'

import { stoneTypes, TYPES } from '../router/store/reducers/stones'
const TRIGGER_ID = 'KEEP_ALIVE_HANDLER';

class KeepAliveHandlerClass {
  _initialized : any;
  store : any;
  state : any;

  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.state = {};
  }

  loadStore(store) {
    LOG.info('LOADED STORE KeepAliveHandler', this._initialized);
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

    LOG.info('KeepAliveHandler: Starting KeepAlive call');

    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      LOG.info('KeepAliveHandler: Starting KeepAlive round for sphere:', sphere.config.name);

      // check every sphere where we are present. Usually this is only one of them!!
      let useRoomLevel = canUseIndoorLocalizationInSphere(state, sphereId);
      let userLevelInSphere = getUserLevelInSphere(state, sphereId);

      let bleController = new BatchCommand(this.store, sphereId);

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
          let delay = state.spheres[sphereId].config.exitDelay || 120;

          // if the home exit is not defined, the room exit and the away should take its place. They are not in the room either!
          if      (behaviourHomeExit.active === true)                   { behaviour = behaviourHomeExit; }
          else if (behaviourRoomExit.active === true && useRoomLevel)   { behaviour = behaviourRoomExit; delay = behaviour.delay; }
          else if (behaviourAway.active === true && !useRoomLevel)      { behaviour = behaviourAway;     delay = behaviour.delay; }

          if (stone.config.handle && stone.config.disabled === false) {
            this._performKeepAliveForStone(sphere, stone, stoneId, behaviour, delay, userLevelInSphere, element, keepAliveId, bleController);
          }
          else if (stone.config.disabled === true) {
            LOG.info('KeepAliveHandler: (' + keepAliveId + ') skip KeepAlive stone is disabled', stoneId);
          }
        }
      });

      bleController.execute({immediate: false, timesToRetry: 1}, false).catch((err) => {})
    });
  }

  _performKeepAliveForStone(sphere, stone, stoneId, behaviour, delay, userLevelInSphere, element, keepAliveId, bleController) {
    LOG.info('KeepAliveHandler: (' + keepAliveId + ') Performing keep Alive to stone handle', stone.config.handle);

    // guests do not send a state, they just prolong the existing keepAlive.
    if (userLevelInSphere === 'guest') {
      bleController.load(stone, stoneId, 'keepAlive').catch((err) => {});
    }
    else {
      // determine what to send
      let changeState = false;
      let newState = 0;
      let timeout = 2.5*KEEPALIVE_INTERVAL;
      // if we have behaviour, send it to the crownstone.
      if (behaviour !== undefined) {
        if (BehaviourUtil.allowBehaviourBasedOnDarkOutside(sphere, behaviour, element) === true) {
          changeState = behaviour.active;
          newState = behaviour.state;
          timeout = Math.max(timeout, delay);
        }
      }

      bleController.load(stone, stoneId, 'keepAliveState', [changeState, newState, timeout]).catch((err) => {});
    }
  }


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




