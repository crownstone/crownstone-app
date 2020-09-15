import { SetupHelper }        from './SetupHelper';
import { Util }               from '../../util/Util';
import {LOGd, LOGe} from '../../logging/Log';
import { SETUP_MODE_TIMEOUT } from '../../ExternalConfig';
import {Scheduler} from "../../logic/Scheduler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { STONE_TYPES } from "../../Enums";
import { core } from "../../core";
import { base_core } from "../../base_core";



/**
 * This class keeps track of the Crownstones in setup state.
 */
class SetupStateHandlerClass {
  _uuid : string;
  _setupModeTimeouts : any;
  _stonesInSetupStateAdvertisements : any;
  _stonesInSetupStateTypes : any;
  _currentSetupState : any;
  _initialized : boolean;
  _ignoreStoneAfterSetup : any;

  _lastAutoSetupTimestamp = 0;

  _setupProgress = 0;

  _spoofedCrownstonePossibility = {};

  constructor() {
    this._uuid = xUtil.getUUID();

    this._setupModeTimeouts = {};
    this._stonesInSetupStateAdvertisements = {};
    this._stonesInSetupStateTypes = {};

    this._ignoreStoneAfterSetup = {};

    this._initialized = false;
    this._currentSetupState = {busy: false, handle: undefined, name: undefined, type: undefined, icon: undefined};
  }

  _resetSetupState() {
    this._currentSetupState = {busy: false, handle: undefined, name: undefined, type: undefined, icon: undefined};
  }


  init() {
    if (this._initialized === false) {
      this._initialized = true;
      // these events are emitted from the setupUtil
      core.eventBus.on("setupStarted",   (handle) => { this._setupProgress = 0; });
      core.eventBus.on("setupCancelled", (handle) => { this._setupProgress = 0; });
      core.eventBus.on("setupInProgress", (data) => {
        this._setupProgress = data.progress;
      });


      // when the setup is finished, we clean up the handle from the list of stones in setup mode
      core.eventBus.on("setupComplete",  (handle) => {
        this._setupProgress = 0;
        this._ignoreStoneAfterSetup[handle] = true;

        // we ignore the stone that just completed setup for 5 seconds after completion to avoid duplicates in the view.
        Scheduler.scheduleCallback(() => {
          this._ignoreStoneAfterSetup[handle] = undefined;
          delete this._ignoreStoneAfterSetup[handle];
        }, 5000, 'setupCompleteTimeout');

        this._resetSetupState();
        // cleaning up the entry of the setup stone
        this._cleanup(handle);
        core.eventBus.emit("setupCleanedUp");
      });

      // if we cancel the setup mode because of an error, we reset the timeout for this handle.
      core.eventBus.on("setupCancelled", (handle) => {
        this._resetSetupState();
        this._setSetupTimeout(handle);
        core.eventBus.emit("setupCleanedUp");
      });

      core.nativeBus.on(core.nativeBus.topics.setupAdvertisement, (setupAdvertisement : crownstoneAdvertisement) => {
        let handle = setupAdvertisement.handle;
        let emitDiscovery = false;

        // If we detect a normal validated advertisement from a Crownstone that we ALSO see as a setup Crownstone, we assume it is spoofed.
        // It then has to not be validated for at least 30 seconds before we give it a chance as a setup Crownstone.
        if (this._spoofedCrownstonePossibility[handle] !== undefined) {
          if (Date.now() - this._spoofedCrownstonePossibility[handle] < 30000) {
            return;
          }
          else {
            delete this._spoofedCrownstonePossibility[handle];
          }
        }



        let stoneData = MapProvider.stoneHandleMap[handle];
        if (stoneData && stoneData.stoneConfig.dfuResetRequired === true) {
          LOGd.info("SetupStateHandler: Fallback for DFU stones is called. Stopping setup event propagation.");
          return;
        }

        // emit advertisements for other views
        core.eventBus.emit(Util.events.getSetupTopic(setupAdvertisement.handle), setupAdvertisement);

        // if we just completed the setup of this stone, we ignore it for a while to avoid duplicates.
        if (this._ignoreStoneAfterSetup[handle]) {
          return;
        }

        // store the data of this setup Crownstone
        if (this._stonesInSetupStateAdvertisements[handle] === undefined) {
          // check if it is the first setup stone we see and if so, emit the setupStonesDetected event
          if (Object.keys(this._stonesInSetupStateAdvertisements).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInSetupStateAdvertisements[handle] = setupAdvertisement;
          this._stonesInSetupStateTypes[handle] = this._getTypeData(setupAdvertisement);

          if (this._stonesInSetupStateTypes[handle] === undefined) {
            delete this._stonesInSetupStateTypes[handle];
          }
          else {
            core.eventBus.emit("setupStoneChange", this.areSetupStonesAvailable());
          }
        }

        if (emitDiscovery) {
          core.eventBus.emit("setupStonesDetected");
        }

        // (re)start setup timeout
        this._setSetupTimeout(handle);
      });

      core.nativeBus.on(core.nativeBus.topics.advertisement, (advertisement : crownstoneAdvertisement) => {
        let handle = advertisement.handle;
        if (this._stonesInSetupStateAdvertisements[handle] !== undefined) {
          // this is not currently in setup.
          if (this._currentSetupState.handle !== handle) {
            this._cleanup(handle);
            this._spoofedCrownstonePossibility[handle] = Date.now();
          }
        }

        if (this._spoofedCrownstonePossibility[handle]) {
          this._spoofedCrownstonePossibility[handle] = Date.now();
        }
      })


    }
  }


  _setSetupTimeout(handle) {
    // make sure we do not delete the stone that is being setup from the list.
    if (this._currentSetupState.handle === handle && this._currentSetupState.busy === true) {
      return;
    }

    // clear existing timeouts.
    if (typeof this._setupModeTimeouts[handle] === 'function' ) {
      this._setupModeTimeouts[handle]();
      this._setupModeTimeouts[handle] = null;
    }
    // set a new timeout that cleans up after this entry
    this._setupModeTimeouts[handle] = Scheduler.scheduleCallback(() => {
      this._cleanup(handle);
    }, SETUP_MODE_TIMEOUT, 'SETUP_MODE_TIMEOUT');
  }

  _cleanup(handle) {
    delete this._stonesInSetupStateAdvertisements[handle];
    delete this._stonesInSetupStateTypes[handle];
    delete this._setupModeTimeouts[handle];
    core.eventBus.emit("setupStoneChange", this.areSetupStonesAvailable());
    if (Object.keys(this._stonesInSetupStateAdvertisements).length === 0) {
      core.eventBus.emit("noSetupStonesVisible");
    }
  }

  _getTypeData(advertisement : crownstoneAdvertisement) {
    let payload = {};
    if (     advertisement.serviceData.deviceType == 'plug')          { payload = {name: 'Crownstone Plug',        icon: 'c2-pluginFilled', type:STONE_TYPES.plug,        }; }
    else if (advertisement.serviceData.deviceType == 'builtin')       { payload = {name: 'Crownstone Builtin',     icon: 'c2-crownstone',   type:STONE_TYPES.builtin,     }; }
    else if (advertisement.serviceData.deviceType == 'builtinOne')    { payload = {name: 'Crownstone Builtin One', icon: 'c2-crownstone',   type:STONE_TYPES.builtinOne,  }; }
    else if (advertisement.serviceData.deviceType == 'guidestone')    { payload = {name: 'Guidestone',             icon: 'c2-crownstone',   type:STONE_TYPES.guidestone,  }; }
    else if (advertisement.serviceData.deviceType == 'crownstoneUSB') { payload = {name: 'Crownstone USB',         icon: 'c1-router',       type:STONE_TYPES.crownstoneUSB}; }
    else {
      LOGe.info("UNKNOWN DEVICE in setup procedure", advertisement);
      return undefined;
    }

    payload["handle"] = advertisement.handle;

    return payload;
  }
  
  setupStone(handle, sphereId) {
    if (this._stonesInSetupStateAdvertisements[handle] !== undefined) {
      return this._setupStone(
        handle,
        sphereId,
        this._stonesInSetupStateTypes[handle].name,
        this._stonesInSetupStateTypes[handle].type,
        this._stonesInSetupStateTypes[handle].icon
      )
    }
    else {
      return new Promise((resolve, reject) => {
        reject({code: 1, message:"Stone not available"});
      })
    }
  }

  setupExistingStone(handle, sphereId, stoneId, silent : boolean = false) {
    let stoneConfig = core.store.getState().spheres[sphereId].stones[stoneId].config;
    return this._setupStone(handle, sphereId, stoneConfig.name, stoneConfig.type, stoneConfig.icon, silent);
  }

  _setupStone(handle, sphereId, name, type, icon, silent : boolean = false) {
    let helper = new SetupHelper(
      handle,
      name,
      type,
      icon
    );

    this._currentSetupState = {
      busy: true,
      handle: handle,
      name: name,
      type: type,
      icon: icon,
    };

    // stop the timeout that removed this stone from the list.
    if (typeof this._setupModeTimeouts[handle] === 'function' ) {
      this._setupModeTimeouts[handle]();
      this._setupModeTimeouts[handle] = null;
    }

    core.eventBus.emit("setupStarting");

    return helper.claim(sphereId, silent);
  }

  getSetupStones() {
    // make a copy of the data to make sure nothing can influence the data.
    return {...this._stonesInSetupStateTypes};
  }

  areSetupStonesAvailable() {
    return (Object.keys(this._stonesInSetupStateAdvertisements).length > 0 || this._currentSetupState.busy);
  }


  howManySetupStonesAvailable() {
    if (this._currentSetupState.busy) { return 0; }
    return Object.keys(this._stonesInSetupStateAdvertisements).length;
  }

  isSetupInProgress() {
    return this._currentSetupState.busy;
  }
  
  getStoneInSetupProcess() {
    return {...this._currentSetupState}; 
  }

  getSetupProgress() {
    return this._setupProgress;
  }

}

export const SetupStateHandler = new SetupStateHandlerClass();