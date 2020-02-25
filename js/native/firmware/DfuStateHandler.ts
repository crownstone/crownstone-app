import { BleUtil }            from '../../util/BleUtil';
import { Util }               from '../../util/Util';
import { LOG }                from '../../logging/Log';
import { DFU_MODE_TIMEOUT }   from '../../ExternalConfig';
import { MapProvider }        from "../../backgroundProcesses/MapProvider";
import {Scheduler} from "../../logic/Scheduler";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";

/**
 * This class keeps track of the Crownstones in DFU state.
 */
class DfuStateHandlerClass {
  _uuid : string;
  _initialized : boolean = false;
  _stonesInDfuMode : any = {};
  _dfuTimeouts : any = {};

  _dfuInProgress = false;

  constructor() {
    this._uuid = xUtil.getUUID();
  }

  init() {
    LOG.info('LOADED STORE DfuStateHandler', this._initialized);
    if (this._initialized === false) {
      this._init();
    }
  }

  _init() {
    if (this._initialized === false) {
      this._initialized = true;

      let handleDfuAdvertisement = (data : crownstoneBaseAdvertisement) => {
        let handle = data.handle;
        let emitDiscovery = false;

        if (!MapProvider.stoneHandleMap[handle]) {
          LOG.info("DfuStateHandler: DFU Crownstone found but could not match it with our database. Handle:", handle);
          return;
        }

        // emit advertisements for other views
        core.eventBus.emit(Util.events.getDfuTopic(data.handle), data);

        // we scan high frequency when we see a DFU node
        BleUtil.startHighFrequencyScanning(this._uuid, true);

        // store the data of this DFU Crownstone
        if (this._stonesInDfuMode[handle] === undefined) {
          // check if it is the first DFU stone we see and if so, emit the dfuStonesDetected event
          if (Object.keys(this._stonesInDfuMode).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInDfuMode[handle] = {advertisement: data, data: MapProvider.stoneHandleMap[handle], sphereId: MapProvider.stoneHandleMap[handle].sphereId};
          LOG.info("DfuStateHandler: Found new DFU Crownstone.", MapProvider.stoneHandleMap[handle]);
          core.eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
        }

        if (emitDiscovery) {
          core.eventBus.emit("dfuStonesDetected");
        }

        // (re)start setup timeout
        this._setDfuTimeout(handle);
      };


      // add advertisement events in case they are from crownstones that did not finish their DFU process.
      core.nativeBus.on(core.nativeBus.topics.advertisement, (data) => {
        let stoneData = MapProvider.stoneHandleMap[data.handle];
        if (stoneData && stoneData.stoneConfig.dfuResetRequired === true && stoneData.stoneConfig.handle) {
          handleDfuAdvertisement(data);
        }
      });

      // handle DFU events
      core.nativeBus.on(core.nativeBus.topics.dfuAdvertisement, (data : crownstoneBaseAdvertisement) => {
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

    core.eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
    if (Object.keys(this._stonesInDfuMode).length === 0) {
      LOG.info("DfuStateHandler: No DFU stones visible. Disabling HF scanning.");
      core.eventBus.emit("noDfuStonesVisible");
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

  isDfuInProgress() {
    return this._dfuInProgress;
  }

  sphereHasDfuCrownstone(sphereId) {
    let result = false;
    Object.keys(this._stonesInDfuMode).forEach((handle) => {
      if (this._stonesInDfuMode[handle].sphereId === sphereId) {
        result = true;
      }
    })
    return result;
  }

}

export const DfuStateHandler = new DfuStateHandlerClass();