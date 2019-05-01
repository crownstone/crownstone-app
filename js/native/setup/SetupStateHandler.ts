import { SetupHelper }        from './SetupHelper';
import { BleUtil }            from '../../util/BleUtil';
import { Util }               from '../../util/Util';
import {LOG, LOGd, LOGe} from '../../logging/Log';
import { SETUP_MODE_TIMEOUT } from '../../ExternalConfig';
import { DfuStateHandler }    from "../firmware/DfuStateHandler";
import {Scheduler} from "../../logic/Scheduler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import { xUtil } from "../../util/StandAloneUtil";
import { STONE_TYPES } from "../../Enums";
import { core } from "../../core";



/**
 * This class keeps track of the Crownstones in setup state.
 */
class SetupStateHandlerClass {
  _uuid : string;
  _store : any;
  _setupModeTimeouts : any;
  _stonesInSetupStateAdvertisements : any;
  _stonesInSetupStateTypes : any;
  _currentSetupState : any;
  _initialized : boolean;
  _ignoreStoneAfterSetup : any;


  constructor() {
    this._uuid = xUtil.getUUID();

    this._store = undefined;
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

  loadStore(store) {
    LOG.info('LOADED STORE SetupStateHandler', this._initialized);
    if (this._initialized === false) {
      this._store = store;
      this._init();
    }
  }

  _init() {
    if (this._initialized === false) {
      this._initialized = true;
      // these events are emitted from the setupUtil
      core.eventBus.on("setupStarted",   (handle) => {});

      // when the setup is finished, we clean up the handle from the list of stones in setup mode
      core.eventBus.on("setupComplete",  (handle) => {
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

      core.nativeBus.on(core.nativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        let handle = setupAdvertisement.handle;
        let emitDiscovery = false;

        // DFU takes preference over Setup. DFU can reserve a setup Crownstone for the setup process.
        if (DfuStateHandler.handleReservedForDfu(handle)) {
          return;
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

        // we scan high frequency when we see a setup node
        BleUtil.startHighFrequencyScanning(this._uuid);

        // store the data of this setup Crownstone
        if (this._stonesInSetupStateAdvertisements[handle] === undefined) {
          // check if it is the first setup stone we see and if so, emit the setupStonesDetected event
          if (Object.keys(this._stonesInSetupStateAdvertisements).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInSetupStateAdvertisements[handle] = setupAdvertisement;
          this._stonesInSetupStateTypes[handle] = this._getTypeData(setupAdvertisement);
          core.eventBus.emit("setupStoneChange", this.areSetupStonesAvailable());
        }

        if (emitDiscovery) {
          core.eventBus.emit("setupStonesDetected");
        }

        // (re)start setup timeout
        this._setSetupTimeout(handle);
      });
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

  _getTypeData(advertisement) {
    if (advertisement.serviceData.deviceType      == 'plug')
      return {name: 'Crownstone Plug',    icon: 'c2-pluginFilled',  type:STONE_TYPES.plug,       handle: advertisement.handle};
    else if (advertisement.serviceData.deviceType == 'builtin')
      return {name: 'Crownstone Builtin', icon: 'c2-crownstone',    type:STONE_TYPES.builtin,    handle: advertisement.handle};
    else if (advertisement.serviceData.deviceType == 'guidestone')
      return {name: 'Guidestone',         icon: 'c2-crownstone',    type:STONE_TYPES.guidestone, handle: advertisement.handle};
    else if (advertisement.serviceData.deviceType == 'crownstoneUSB')
      return {name: 'Crownstone USB',     icon: 'c1-router',        type:STONE_TYPES.crownstoneUSB, handle: advertisement.handle};
    else {
      LOGe.info("UNKNOWN DEVICE in setup procedure", advertisement);
    }
  }
  
  setupStone(handle, sphereId) {
    if (this._stonesInSetupStateAdvertisements[handle] !== undefined) {
      return this._setupStone(
        handle,
        sphereId,
        this._stonesInSetupStateTypes[handle].name,
        this._stonesInSetupStateTypes[handle].type,
        this._stonesInSetupStateTypes[handle].icon
      );
    }
    else {
      return new Promise((resolve, reject) => {
        reject({code: 1, message:"Stone not available"});
      })
    }
  }

  setupExistingStone(handle, sphereId, stoneId, silent : boolean = false) {
    let stoneConfig = this._store.getState().spheres[sphereId].stones[stoneId].config;
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

    return helper.claim(this._store, sphereId, silent);
  }

  getSetupStones() {
    // make a copy of the data to make sure nothing can influence the data.
    return {...this._stonesInSetupStateTypes};
  }

  areSetupStonesAvailable() {
    return (Object.keys(this._stonesInSetupStateAdvertisements).length > 0 || this._currentSetupState.busy) || true;
  }

  isSetupInProgress() {
    return this._currentSetupState.busy;
  }
  
  getStoneInSetupProcess() {
    return {...this._currentSetupState}; 
  }

}

export const SetupStateHandler = new SetupStateHandlerClass();