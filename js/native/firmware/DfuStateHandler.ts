import { NativeBus }          from '../libInterface/NativeBus';
import { BleUtil }            from '../../util/BleUtil';
import { eventBus }           from '../../util/EventBus';
import { Util }               from '../../util/Util';
import { LOG }                from '../../logging/Log';
import { DFU_MODE_TIMEOUT }   from '../../ExternalConfig';
import { MapProvider }        from "../../backgroundProcesses/MapProvider";
import {Scheduler} from "../../logic/Scheduler";

/**
 * This class keeps track of the Crownstones in DFU state.
 */
class DfuStateHandlerClass {
  _uuid : string;
  _store : any;
  _initialized : boolean = false;
  _ignoreDuringDfuOverlay : boolean = false;
  _stonesInDfuMode : any = {};
  _dfuTimeouts : any = {};

  constructor() {
    this._uuid = Util.getUUID();
  }

  _loadStore(store) {
    LOG.info('LOADED STORE DfuStateHandler', this._initialized);
    if (this._initialized === false) {
      this._store = store;
      this._init();

      eventBus.on("updateCrownstoneFirmware",      () => { this._ignoreDuringDfuOverlay = true; this._cleanupAll(); });
      eventBus.on("updateCrownstoneFirmwareEnded", () => {
        this._ignoreDuringDfuOverlay = false;
        // scan hf just in case for a short time afterwards
        BleUtil.startHighFrequencyScanning(this._uuid, 2500);
      });
    }
  }

  _init() {
    if (this._initialized === false) {
      this._initialized = true;

      let handleDfuAdvertisement = (data) => {
        let handle = data.handle;
        let emitDiscovery = false;

        if (!MapProvider.stoneHandleMap[handle]) {
          LOG.info("DfuStateHandler: DFU Crownstone found but could not match it with our database. Handle:", handle);
          return;
        }

        // emit advertisements for other views
        eventBus.emit(Util.events.getDfuTopic(data.handle), data);

        // we scan high frequency when we see a setup node
        BleUtil.startHighFrequencyScanning(this._uuid, true);

        // store the data of this DFU Crownstone
        if (this._stonesInDfuMode[handle] === undefined) {
          // check if it is the first DFU stone we see and if so, emit the dfuStonesDetected event
          if (Object.keys(this._stonesInDfuMode).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInDfuMode[handle] = {advertisement: data, data: MapProvider.stoneHandleMap[handle]};
          LOG.info("DfuStateHandler: Found new DFU Crownstone.");
          eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
        }

        if (emitDiscovery) {
          eventBus.emit("dfuStonesDetected");
        }

        // (re)start setup timeout
        this._setDfuTimeout(handle);
      };


      // add setup events in case they are from crownstones that did not finish their DFU process.
      NativeBus.on(NativeBus.topics.setupAdvertisement, (data) => {
        if (this._ignoreDuringDfuOverlay) { return; }

        let stoneData = MapProvider.stoneHandleMap[data.handle];
        if (stoneData && stoneData.stoneConfig.dfuResetRequired === true && stoneData.stoneConfig.handle) {
          handleDfuAdvertisement(data);
        }
      });

      // add advertisement events in case they are from crownstones that did not finish their DFU process.
      NativeBus.on(NativeBus.topics.advertisement, (data) => {
        if (this._ignoreDuringDfuOverlay) { return; }

        let stoneData = MapProvider.stoneHandleMap[data.handle];
        if (stoneData && stoneData.stoneConfig.dfuResetRequired === true && stoneData.stoneConfig.handle) {
          handleDfuAdvertisement(data);
        }
      });

      // handle DFU events
      NativeBus.on(NativeBus.topics.dfuAdvertisement, (data) => {
        if (this._ignoreDuringDfuOverlay) { return; }

        handleDfuAdvertisement(data);
      });
    }
  }

  _setDfuTimeout(handle) {
    // clear existing timeouts.
    if (typeof this._dfuTimeouts[handle] === 'function' ) {
      this._dfuTimeouts[handle]();
      this._dfuTimeouts[handle] = null;
    }

    // set a new timeout that cleans up after this entry
    this._dfuTimeouts[handle] = Scheduler.scheduleCallback(() => {
      this._cleanup(handle);
    }, DFU_MODE_TIMEOUT, 'DFU_MODE_TIMEOUT');
  }


  _cleanupAll() {
    let handles = Object.keys(this._stonesInDfuMode);
    handles.forEach((handle) => {
      this._cleanup(handle);
    })
  }

  _cleanup(handle) {
    this._stonesInDfuMode[handle] = undefined;
    this._dfuTimeouts[handle] = undefined;

    delete this._stonesInDfuMode[handle];
    delete this._dfuTimeouts[handle];

    eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
    if (Object.keys(this._stonesInDfuMode).length === 0) {
      LOG.info("DfuStateHandler: No DFU stones visible. Disabling HF scanning.");
      eventBus.emit("noDfuStonesVisible");
      BleUtil.stopHighFrequencyScanning(this._uuid);
    }
  }

  areDfuStonesAvailable() {
    return (Object.keys(this._stonesInDfuMode).length > 0);
  }

  getDfuStones() {
    return { ...this._stonesInDfuMode };
  }

  getDfuHandles() {
    return Object.keys(this._stonesInDfuMode);
  }

  handleReservedForDfu(handle) {
    return (this._stonesInDfuMode[handle] !== undefined);
  }

}

export const DfuStateHandler = new DfuStateHandlerClass();