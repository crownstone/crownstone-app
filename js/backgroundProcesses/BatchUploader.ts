import {Scheduler} from "../logic/Scheduler";
import {CLOUD} from "../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL} from "../ExternalConfig";
import {LOGd, LOGe} from "../logging/Log";
import {Util} from "../util/Util";
import { xUtil } from "../util/StandAloneUtil";
import { core } from "../core";

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
    this._batchPowerData();
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

  _batchPowerData() {
    let powerKeys = Object.keys(this.queue.power);
    let successfulUploads = 0;
    let actions = [];
    xUtil.promiseBatchPerformer(powerKeys, (key) => {
      let stoneId = this.queue.power[key].stoneId;
      let sphereId = this.queue.power[key].sphereId;
      let dateId = this.queue.power[key].dateId;

      let data = this.queue.power[key].data;
      let indices = this.queue.power[key].indices;

      this.queue.power[key] = undefined;
      delete this.queue.power[key];

      return CLOUD.forStone(stoneId).updateBatchPowerUsage(data, true)
        .then(() => {
          LOGd.info("BatchUploader: Updated Batch Usage for indices", indices);
          actions.push({type: "SET_BATCH_SYNC_POWER_USAGE", sphereId: sphereId, stoneId: stoneId, dateId: dateId, data: { indices: indices }});
          successfulUploads++;
        })
        .catch((err) => {
          // put the data back in the queue
          if (this.queue.power[key] === undefined) {
            this.queue.power[key] = { dateId: dateId, stoneId: stoneId, sphereId: sphereId, indices:[], data:[] };
          }
          this.queue.power[key].data = this.queue.power[key].data.concat(data);
          this.queue.power[key].indices = this.queue.power[key].indices.concat(indices);
          LOGe.cloud("BatchUploader: Could not upload samples:", indices, " because of: ", err);
        })
    })
    .then(() => {
      // if everything was uploaded
      if (powerKeys.length === successfulUploads) {
        Scheduler.pauseTrigger(TRIGGER_ID);
      }

      // set the sync states
      core.store.batchDispatch(actions);
    })
    .catch((err) => {
      LOGe.cloud("BatchUploader: Error during upload session", err);
    });
  }
}

export const BatchUploader = new BatchUploadClass();