/**
 * This class will collect datapoints on each nativebus ibeacon event.
 * It provides a callback with the amount of points collected.
 * This is used for in-hand and in-pocket data collection.
 */
import { Get } from "../../util/GetUtil";
import { FingerprintUtil } from "../../util/FingerprintUtil";
import { LocalizationCore } from "../LocalizationCore";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../Topics";
import { KNNsigmoid } from "../classifiers/knn";
import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../Core";


export class FingerprintCollector {
  trainingData          : trainingData[]           = [];
  trainingDataProcessed : trainingDataProcessed[]  = [];
  crownstonesAtCreation : Record<CrownstoneIdentifier, true> = {};

  subscriptions = [];

  startTime:  timestamp;
  sphereId:   string;
  locationId: string;

  tick = (amountOfPoints : number) => {};

  type: FingerprintType;

  constructor(sphereId: string, locationId: string, type: FingerprintType) {
    this.sphereId   = sphereId;
    this.locationId = locationId;
    this.type       = type;

    this.startTime  = Date.now();
    let sphere = Get.sphere(this.sphereId);
    if (sphere) {
      for (let stoneId in sphere.stones) {
        let stone = sphere.stones[stoneId];
        this.crownstonesAtCreation[FingerprintUtil.getStoneIdentifierFromStone(stone)] = true;
      }
    }

  }


  start() {
    this.trainingData = [];
    LocalizationCore.pauseLocalization();
    this._listen();
  }


  _listen() {
    this.subscriptions.push(NativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, this.collect.bind(this)));
  }


  collect(data: ibeaconPackage[]) {
    let datapoint          = {dt: Date.now() - this.startTime, data: {}};
    let datapointProcessed = {dt: Date.now() - this.startTime, data: {}};
    for (let point of data) {
      let id = `${point.major}_${point.minor}`;
      datapoint.data[id] = point.rssi;
      datapointProcessed.data[id] = KNNsigmoid(point.rssi);
    }

    this.trainingData.push(datapoint);
    this.trainingDataProcessed.push(datapointProcessed);

    this.tick(this.trainingData.length);
  }


  abort() {
    this.stop();
  }


  stop() {
    LocalizationCore.resumeLocalization();
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.subscriptions = [];
  }


  resume() {
    this._listen();
  }


  store() {
    if (this.trainingData.length === 0) { return; }
    let state = core.store.getState();
    let fingerprintId = xUtil.getUUID();
    core.store.dispatch({
      type:       'ADD_FINGERPRINT_V2',
      sphereId:   this.sphereId,
      locationId: this.locationId,
      fingerprintId,
      data: {
        type:                  this.type,
        createdOnDeviceType:   FingerprintUtil.getDeviceTypeDescription(), // ${device type string}_${userId who collected it}
        createdByUserId:       state.user.userId,
        crownstonesAtCreation: this.crownstonesAtCreation, // maj_min as id representing the Crownstone.
        data:                  this.trainingData,
      }
    });
  }
}
