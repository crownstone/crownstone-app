import {Scheduler} from "../logic/Scheduler";
import {CLOUD} from "../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL} from "../ExternalConfig";
import {LOGd, LOGe} from "../logging/Log";
import { xUtil } from "../util/StandAloneUtil";
import { core } from "../Core";

const TRIGGER_ID = 'BATCH_UPLOADER_INTERVAL';

class BatchUploadClass {
  queue : any = {
    power: {},
    energy: {},
  };
  _initialized = false;


  init() {
    if (this._initialized === false) {
      this._initialized = true;

      Scheduler.setRepeatingTrigger(TRIGGER_ID, {repeatEveryNSeconds: CLOUD_BATCH_UPDATE_INTERVAL});
      Scheduler.loadCallback(TRIGGER_ID, this.batchUpload.bind(this));
      Scheduler.pauseTrigger(TRIGGER_ID);
    }
  }

  batchUpload() {
    if (core.store.getState().user.uploadHighFrequencyPowerUsage === false) {
      // clear queue if the uploading is disabled.
      this.queue = {
        power: {},
        energy: {},
      };
    }
  }

  /**
   * Add a data point to the queue to upload. The index is obtained from the calling method and indicates the position of this item in the database.
   * @param dateId
   * @param sphereId
   * @param stoneId
   * @param index
   * @param data
   */
  addPowerData(dateId, sphereId, stoneId, index, data) {
    Scheduler.resumeTrigger(TRIGGER_ID);
    let key = dateId+'_'+sphereId+'_'+stoneId;
    if (this.queue.power[key] === undefined) {
      this.queue.power[key] = { dateId: dateId, stoneId: stoneId, sphereId: sphereId, indices:[], data:[] };
    }

    this.queue.power[key].indices.push(index);
    this.queue.power[key].data.push(data);
  }

}

export const BatchUploader = new BatchUploadClass();