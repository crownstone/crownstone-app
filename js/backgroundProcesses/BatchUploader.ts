import {Scheduler} from "../logic/Scheduler";
import {CLOUD} from "../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL} from "../ExternalConfig";

const TRIGGER_ID = 'BATCH_UPLOADER_INTERVAL';

class BatchUploadClass {
  queue : any = {
    power: {},
    energy: {},
  };

  constructor() {}

  init() {
    Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: CLOUD_BATCH_UPDATE_INTERVAL});
    Scheduler.loadCallback(TRIGGER_ID, this.batchUpload.bind(this));
    Scheduler.pauseTrigger(TRIGGER_ID);
  }

  batch(arr : any[], index : number, method : PromiseCallback) {
    return new Promise((resolve, reject) => {
      if (index < arr.length) {
        method(arr[index])
          .then(() => {
            return this.batch(arr, index+1, method);
          })
          .then(() => {
            resolve()
          })
          .catch((err) => reject(err))
      }
      else {
        resolve();
      }
    })
  }

  batchUpload() {
    this._batchPowerData();
  }

  addPowerData(stoneId, data) {
    Scheduler.resumeTrigger(TRIGGER_ID);
    if (this.queue.power[stoneId] === undefined) {
      this.queue.power[stoneId] = [];
    }

    this.queue.power[stoneId].push(data);
  }

  _batchPowerData() {
    let stoneIds = Object.keys(this.queue.power);
    let successfulUploads = 0;
    this.batch(stoneIds, 0, (stoneId) => {
      return CLOUD.forStone(stoneId).updateBatchPowerUsage(this.queue.power[stoneId], true)
        .then(() => {
          this.queue.power[stoneId] = undefined;
          delete this.queue.power[stoneId];
          successfulUploads++;
        })
    })

    if (stoneIds.length === successfulUploads) {
      Scheduler.pauseTrigger(TRIGGER_ID);
    }
  }
}

export const BatchUploader = new BatchUploadClass()