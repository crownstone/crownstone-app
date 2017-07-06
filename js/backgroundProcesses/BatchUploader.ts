import {Scheduler} from "../logic/Scheduler";
import {CLOUD} from "../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL} from "../ExternalConfig";
import {LOG} from "../logging/Log";
import {Util} from "../util/Util";

const TRIGGER_ID = 'BATCH_UPLOADER_INTERVAL';

class BatchUploadClass {
  queue : any = {
    power: {},
    energy: {},
  };
  _store: any;
  _initialized = false;

  constructor() {}

  _loadStore(store) {
    this._store = store;
    if (this._initialized === false) {
      this._store = store;
      this._initialized = true;

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: CLOUD_BATCH_UPDATE_INTERVAL});
      Scheduler.loadCallback(TRIGGER_ID, this.batchUpload.bind(this));
      Scheduler.pauseTrigger(TRIGGER_ID);
    }
  }

  batchUpload() {
    this._batchPowerData();
  }

  addPowerData(dateId, sphereId, stoneId, index,  data) {
    Scheduler.resumeTrigger(TRIGGER_ID);
    let key = dateId+'_'+sphereId+'_'+stoneId;
    if (this.queue.power[key] === undefined) {
      this.queue.power[key] = { dateId: dateId, stoneId: stoneId, sphereId: sphereId, indices:[], data:[] };
    }

    this.queue.power[key].indices.push(index);
    this.queue.power[key].data.push(data);
  }

  _batchPowerData() {
    let powerKeys = Object.keys(this.queue.power);
    let successfulUploads = 0;
    let actions = [];
    Util.promiseBatchPerformer(powerKeys, (key) => {
      let stoneId = this.queue.power[key].stoneId;
      let sphereId = this.queue.power[key].sphereId;
      let dateId = this.queue.power[key].dateId;
      return CLOUD.forStone(stoneId).updateBatchPowerUsage(this.queue.power[key].data, true)
        .then(() => {
          actions.push({type: "BATCH_SET_SYNC_POWER_USAGE", sphereId: sphereId, stoneId: stoneId, dateId: dateId, data: { indices: this.queue.power[key].indices }});
          this.queue.power[key] = undefined;
          delete this.queue.power[key];
          successfulUploads++;
        })
        .catch((err) => {
          LOG.error("BatchUploader: Could not upload samples", err);
        })
    })
    .catch((err) => {});

    if (powerKeys.length === successfulUploads) {
      Scheduler.pauseTrigger(TRIGGER_ID);
    }

    // set the sync states
    this._store.batchDispatch(actions);
  }
}

export const BatchUploader = new BatchUploadClass();