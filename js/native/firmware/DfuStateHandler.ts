import { NativeBus }          from '../libInterface/NativeBus';
import { BleUtil }            from '../../util/BleUtil';
import { eventBus }           from '../../util/EventBus';
import { Util }               from '../../util/Util';
import { LOG }                from '../../logging/Log';
import { DFU_MODE_TIMEOUT }   from '../../ExternalConfig';
import { MapProvider }        from "../../backgroundProcesses/MapProvider";

/**
 * This class keeps track of the Crownstones in DFU state.
 */
class DfuStateHandlerClass {
  _uuid : string;
  _store : any;
  _initialized : boolean = false;
  _stonesInDfuMode : any = {};
  _dfuTimeouts : any = {};

  constructor() {
    this._uuid = Util.getUUID();
  }

  loadStore(store) {
    LOG.info('LOADED STORE DfuStateHandler', this._initialized);
    if (this._initialized === false) {
      this._store = store;
      this._init();
    }
  }

  _init() {
    if (this._initialized === false) {
      this._initialized = true;
      // these events are emitted from the setupUtil
      NativeBus.on(NativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        let handle = dfuAdvertisement.handle;
        let emitDiscovery = false;

        if (MapProvider.stoneHandleMap[handle] === undefined) {
          return;
        }

        // emit advertisements for other views
        eventBus.emit(Util.events.getDfuTopic(dfuAdvertisement.handle), dfuAdvertisement);

        // we scan high frequency when we see a setup node
        BleUtil.startHighFrequencyScanning(this._uuid, true);

        // store the data of this setup Crownstone
        if (this._stonesInDfuMode[handle] === undefined) {
          // check if it is the first setup stone we see and if so, emit the setupStonesDetected event
          if (Object.keys(this._stonesInDfuMode).length === 0) {
            emitDiscovery = true;
          }

          this._stonesInDfuMode[handle] = {advertisement: dfuAdvertisement, data: MapProvider.stoneHandleMap[handle]};
          eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
        }

        if (emitDiscovery) {
          eventBus.emit("dfuStonesDetected");
        }

        // (re)start setup timeout
        this._setDfuTimeout(handle);
      });
    }
  }

  _setDfuTimeout(handle) {
    // clear existing timeouts.
    if (this._dfuTimeouts[handle] !== undefined) {
      clearTimeout(this._dfuTimeouts[handle]);
    }
    // set a new timeout that cleans up after this entry
    this._dfuTimeouts[handle] = setTimeout(() => {
      this._cleanup(handle);
    }, DFU_MODE_TIMEOUT);
  }

  _cleanup(handle) {
    delete this._stonesInDfuMode[handle];
    delete this._stonesInDfuMode[handle];
    delete this._dfuTimeouts[handle];
    eventBus.emit("dfuStoneChange", this.areDfuStonesAvailable());
    if (Object.keys(this._stonesInDfuMode).length === 0) {
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

}

export const DfuStateHandler = new DfuStateHandlerClass();