import { Scheduler } from '../logic/Scheduler';
import { BehaviourUtil } from '../util/BehaviourUtil';
import { LOG } from '../logging/Log'
import { KEEPALIVE_INTERVAL, KEEPALIVE_ATTEMPTS } from '../ExternalConfig';
import { NativeBus } from './Proxy';
import { BatchCommandHandler } from '../logic/BatchCommandHandler';
import { canUseIndoorLocalizationInSphere, getUserLevelInSphere } from '../util/DataUtil'
import { Util } from '../util/Util'

import { stoneTypes, TYPES } from '../router/store/reducers/stones'
const TRIGGER_ID = 'KEEP_ALIVE_HANDLER';

class KeepAliveHandlerClass {
  _initialized : any;
  store : any;
  state : any;
  lastTimeFired : number = 0;

  constructor() {
    this._initialized = false;
    this.store = undefined;
    this.state = {};
  }

  loadStore(store) {
    LOG.info('LOADED STORE KeepAliveHandler', this._initialized);
    if (this._initialized === false) {
      this.store = store;
      // reset last time fired to 0 so the time diff method will
      NativeBus.on(NativeBus.topics.enterSphere, () => { this.lastTimeFired = 0; });
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


  timeUntilNextTrigger() {
    let now = new Date().valueOf();
    let nextTriggerTime = this.lastTimeFired + KEEPALIVE_INTERVAL*1000;
    if (nextTriggerTime < now) {
      return 0;
    }
    else {
      return nextTriggerTime - now;
    }
  }


  fireTrigger() {
    Scheduler.fireTrigger(TRIGGER_ID);
  }


  keepAlive() {
    this.lastTimeFired = new Date().valueOf();

    const state = this.store.getState();
    let sphereIds = Object.keys(state.spheres);

    LOG.info('KeepAliveHandler: Starting KeepAlive call');

    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      LOG.info('KeepAliveHandler: Starting KeepAlive round for sphere:', sphere.config.name);

      // check every sphere where we are present. Usually this is only one of them!!
      let useRoomLevel = canUseIndoorLocalizationInSphere(state, sphereId);
      let userLevelInSphere = getUserLevelInSphere(state, sphereId);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        // for each stone in sphere select the behaviour we want to copy into the keep Alive
        let stone = sphere.stones[stoneId];

        let keepAliveId = (Math.floor(Math.random()*1e6)).toString(36);

        if (stone.config.type !== stoneTypes.guidestone) {
          let element = Util.data.getElement(sphere, stone);
          let behaviourHomeExit = element.behaviour[TYPES.HOME_EXIT];
          let behaviourRoomExit = element.behaviour[TYPES.ROOM_EXIT];
          let behaviourAway = element.behaviour[TYPES.AWAY];

          let behaviour = undefined;
          let delay = Math.max(300, state.spheres[sphereId].config.exitDelay) + 0.5*KEEPALIVE_INTERVAL;

          // if the home exit is not defined, the room exit and the away should take its place. They are not in the room either!
          if      (behaviourHomeExit.active === true)                   { behaviour = behaviourHomeExit; }
          else if (behaviourRoomExit.active === true && useRoomLevel)   { behaviour = behaviourRoomExit; delay = behaviour.delay; }
          else if (behaviourAway.active === true && !useRoomLevel)      { behaviour = behaviourAway;     delay = behaviour.delay; }

          if (stone.config.handle && stone.config.disabled === false) {
            this._performKeepAliveForStone(sphere, sphereId, stone, stoneId, behaviour, delay, userLevelInSphere, element, keepAliveId);
          }
          else if (stone.config.disabled === true) {
            LOG.info('KeepAliveHandler: (' + keepAliveId + ') skip KeepAlive stone is disabled', stoneId);
          }
        }
      });

      BatchCommandHandler.execute(false).catch((err) => {})
    });
  }

  _performKeepAliveForStone(sphere, sphereId, stone, stoneId, behaviour, delay, userLevelInSphere, element, keepAliveId) {
    LOG.info('KeepAliveHandler: (' + keepAliveId + ') setting up keep Alive to stone handle', stone.config.handle);

    // guests do not send a state, they just prolong the existing keepAlive.
    if (userLevelInSphere === 'guest') {
      BatchCommandHandler.load(stone, stoneId, sphereId, {commandName:'keepAlive'}, KEEPALIVE_ATTEMPTS).catch((err) => {});
    }
    else {
      // determine what to send
      let changeState = false;
      let newState = 0;
      // if we have behaviour, send it to the crownstone.
      if (behaviour !== undefined) {
        if (BehaviourUtil.allowBehaviourBasedOnDarkOutside(sphere, behaviour, element) === true) {
          changeState = behaviour.active;
          newState = behaviour.state;
        }
      }

      BatchCommandHandler.load(
        stone,
        stoneId,
        sphereId,
        {commandName:'keepAliveState', changeState:changeState, state: newState, timeout: delay},
        KEEPALIVE_ATTEMPTS
      )
        .catch((err) => {});
    }
  }
}

export const KeepAliveHandler = new KeepAliveHandlerClass();




