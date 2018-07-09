import { Scheduler }                              from '../logic/Scheduler';
import { BehaviourUtil }                          from '../util/BehaviourUtil';
import { LOG }                                    from '../logging/Log'
import { KEEPALIVE_INTERVAL, KEEPALIVE_ATTEMPTS } from '../ExternalConfig';
import { NativeBus }                              from '../native/libInterface/NativeBus';
import { BatchCommandHandler }                    from '../logic/BatchCommandHandler';
import { Util }                                   from '../util/Util'
import { STONE_TYPES, BEHAVIOUR_TYPES }                      from '../router/store/reducers/stones'
import { canUseIndoorLocalizationInSphere } from '../util/DataUtil'
import {Permissions} from "./PermissionManager";

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


  fireTrigger() {
    Scheduler.fireTrigger(TRIGGER_ID);
  }


  clearCurrentKeepAlives() {
    const state = this.store.getState();
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];
      LOG.info('KeepAliveHandler: Starting the clearing of all KeepAlives in sphere:', sphere.config.name);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        // for each stone in sphere select the behaviour we want to copy into the keep Alive
        let stone = sphere.stones[stoneId];

        let keepAliveId = (Math.floor(Math.random()*1e6)).toString(36);

        if (stone.config.type !== STONE_TYPES.guidestone) {
          if (stone.config.handle && stone.config.disabled === false) {
            let element = Util.data.getElement(this.store, sphereId, stoneId, stone);
            this._performKeepAliveForStone(sphere, sphereId, stone, stoneId, {active:false, state:0}, 10, element, keepAliveId);
          }
        }
      });

      BatchCommandHandler.execute()
    });
  }

  keepAlive() {
    this.lastTimeFired = new Date().valueOf();

    const state = this.store.getState();

    // do not use keepAlives if the user does not want to.
    if (state.app.keepAlivesEnabled === false || state.app.indoorLocalizationEnabled === false) {
      return;
    }

    let sphereIds = Object.keys(state.spheres);

    LOG.info('KeepAliveHandler: Starting KeepAlive call');

    sphereIds.forEach((sphereId) => {
      let sphere = state.spheres[sphereId];

      // Do not keep alive in spheres that we are not present in.
      if (sphere.state.present === false) {
        return;
      }

      LOG.info('KeepAliveHandler: Starting KeepAlive round for sphere:', sphere.config.name);

      // check every sphere where we are present. Usually this is only one of them!!
      let useRoomLevel = canUseIndoorLocalizationInSphere(state, sphereId);

      let stoneIds = Object.keys(sphere.stones);
      stoneIds.forEach((stoneId) => {
        // for each stone in sphere select the behaviour we want to copy into the keep Alive
        let stone = sphere.stones[stoneId];

        let keepAliveId = (Math.floor(Math.random()*1e6)).toString(36);

        if (stone.config.type !== STONE_TYPES.guidestone) {
          let element = Util.data.getElement(this.store, sphereId, stoneId, stone);
          if (!element || !element.behaviour) {
            LOG.error("KeepAliveHandler: Invalid Element received");
            return;
          }

          let behaviourHomeExit = element.behaviour[BEHAVIOUR_TYPES.HOME_EXIT];
          let behaviourRoomExit = element.behaviour[BEHAVIOUR_TYPES.ROOM_EXIT];
          let behaviourAway = element.behaviour[BEHAVIOUR_TYPES.AWAY];

          let behaviour = undefined;
          let determineDelay = (initial) => { return Math.max(300, initial) + 0.5*KEEPALIVE_INTERVAL };
          let delay = determineDelay(state.spheres[sphereId].config.exitDelay);

          // if the home exit is not defined, the room exit and the away should take its place. They are not in the room either!
          if      (behaviourHomeExit.active === true)                   { behaviour = behaviourHomeExit; }
          else if (behaviourRoomExit.active === true && useRoomLevel)   { behaviour = behaviourRoomExit; delay = determineDelay(behaviour.delay); }
          else if (behaviourAway.active     === true && !useRoomLevel)  { behaviour = behaviourAway;     delay = determineDelay(behaviour.delay); }

          if (stone.config.handle) {
            this._performKeepAliveForStone(sphere, sphereId, stone, stoneId, behaviour, delay, element, keepAliveId);
          }
        }
      });

      BatchCommandHandler.execute()
    });
  }

  _performKeepAliveForStone(sphere, sphereId, stone, stoneId, behaviour, delay, element, keepAliveId) {
    LOG.info('KeepAliveHandler: (' + keepAliveId + ') setting up keep Alive to stone handle', stone.config.handle);

    // guests do not send a state, they just prolong the existing keepAlive.
    if (Permissions.inSphere(sphereId).useKeepAliveState) {
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
        {commandName: 'keepAliveState', changeState: changeState, state: newState, timeout: delay},
        {},
        KEEPALIVE_ATTEMPTS,
        'from _performKeepAliveForStone in KeepAliveHandler'
      ).catch((err) => {});
    }
    else {
      BatchCommandHandler.load(stone, stoneId, sphereId, {commandName: 'keepAlive'}, {},KEEPALIVE_ATTEMPTS,'from _performKeepAliveForStone in KeepAliveHandler').catch((err) => {});
    }
  }
}

export const KeepAliveHandler = new KeepAliveHandlerClass();




