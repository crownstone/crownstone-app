import { NativeBus }          from '../libInterface/NativeBus';
import { SetupHelper }        from './SetupHelper';
import { BleUtil }            from '../../util/BleUtil';
import { stoneTypes }         from '../../router/store/reducers/stones'
import { eventBus }           from '../../util/EventBus';
import { Util }               from '../../util/Util';
import { LOG }                from '../../logging/Log';
import { SETUP_MODE_TIMEOUT } from '../../ExternalConfig';
import { getMapOfCrownstonesInAllSpheresByHandle } from '../../util/DataUtil';


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
  referenceHandleMap : object;
  _initialized : boolean;


  constructor() {
    this._uuid = Util.getUUID();

    this._store = undefined;
    this._setupModeTimeouts = {};
    this._stonesInSetupStateAdvertisements = {};
    this._stonesInSetupStateTypes = {};

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

      // TODO: Make into map entity so this is only done once.
      // refresh maps when the database changes
      this._store.subscribe(() => {
        const state = this._store.getState();
        this.referenceHandleMap = getMapOfCrownstonesInAllSpheresByHandle(state);
      });

    }
  }

  _init() {
    if (this._initialized === false) {
      this._initialized = true;
      // these events are emitted from the setupUtil
      eventBus.on("setupStarted",   (handle) => {});

      // when the setup is finished, we clean up the handle from the list of stones in setup mode
      eventBus.on("setupComplete",  (handle) => {
        this._resetSetupState();
        // cleaning up the entry of the setup stone
        this._cleanup(handle);
      });

      // if we cancel the setup mode because of an error, we reset the timeout for this handle.
      eventBus.on("setupCancelled", (handle) => {
        this._resetSetupState();
        this._setSetupTimeout(handle);
      });

      NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        let handle = setupAdvertisement.handle;
        let emitDiscovery = false;
        // we scan high frequency when we see a setup node
        BleUtil.startHighFrequencyScanning(this._uuid);

        // store the data of this setup Crownstone
        if (this._stonesInSetupStateAdvertisements[handle] === undefined) {
          // check if it is the first setup stone we see and if so, emit the setupStonesDetected event
          if (Object.keys(this._stonesInSetupStateAdvertisements).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInSetupStateAdvertisements[handle] = setupAdvertisement;
          this._stonesInSetupStateTypes[handle] = SetupStateHandlerClass._getTypeData(setupAdvertisement);
          eventBus.emit("setupStoneChange", this.areSetupStonesAvailable());
        }

        if (emitDiscovery) {
          eventBus.emit("setupStonesDetected");
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
    if (this._setupModeTimeouts[handle] !== undefined) {
      clearTimeout(this._setupModeTimeouts[handle]);
    }
    // set a new timeout that cleans up after this entry
    this._setupModeTimeouts[handle] = setTimeout(() => {
      this._cleanup(handle);
    }, SETUP_MODE_TIMEOUT);
  }

  _cleanup(handle) {
    delete this._stonesInSetupStateAdvertisements[handle];
    delete this._stonesInSetupStateTypes[handle];
    delete this._setupModeTimeouts[handle];
    eventBus.emit("setupStoneChange", this.areSetupStonesAvailable());
    if (Object.keys(this._stonesInSetupStateAdvertisements).length === 0) {
      eventBus.emit("noSetupStonesVisible");
    }
  }

  static _getTypeData(advertisement) {
    if (advertisement.isCrownstonePlug)
      return {name: 'Crownstone Plug',    icon: 'c2-pluginFilled',  type:stoneTypes.plug,       handle: advertisement.handle};
    else if (advertisement.isCrownstoneBuiltin)
      return {name: 'Crownstone Builtin', icon: 'c2-crownstone',    type:stoneTypes.builtin,    handle: advertisement.handle};
    else if (advertisement.isGuidestone)
      return {name: 'Guidestone',         icon: 'c2-crownstone',    type:stoneTypes.guidestone, handle: advertisement.handle};
    else {
      LOG.error("UNKNOWN DEVICE in setup procedure", advertisement);
    }
  }
  
  setupStone(handle, sphereId) {
    if (this._stonesInSetupStateAdvertisements[handle] !== undefined) {
      let helper = new SetupHelper(
        this._stonesInSetupStateAdvertisements[handle],
        this._stonesInSetupStateTypes[handle].name,
        this._stonesInSetupStateTypes[handle].type,
        this._stonesInSetupStateTypes[handle].icon
      );

      this._currentSetupState = {
        busy: true,
        handle: handle,
        name: this._stonesInSetupStateTypes[handle].name,
        type: this._stonesInSetupStateTypes[handle].type,
        icon: this._stonesInSetupStateTypes[handle].icon,
      };

      // stop the timeout that removed this stone from the list.
      if (this._setupModeTimeouts[handle] !== undefined) {
        clearTimeout(this._setupModeTimeouts[handle]);
      }

      return helper.claim(this._store, sphereId);
    }
    else {
      return new Promise((resolve, reject) => {
        reject({code: 1, message:"Stone not available"})
      })
    }
  }

  getSetupStones() {
    // make a copy of the data to make sure nothing can influence the data.
    return {...this._stonesInSetupStateTypes};
  }

  areSetupStonesAvailable() {
    return (Object.keys(this._stonesInSetupStateAdvertisements).length > 0 || this._currentSetupState.busy);
  }
  
  isSetupInProgress() {
    return this._currentSetupState.busy;
  }
  
  getStoneInSetupProcess() {
    return {...this._currentSetupState}; 
  }


}

export const SetupStateHandler = new SetupStateHandlerClass();