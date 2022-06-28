import { NativeBus } from "../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS, TOPICS } from "../../../Topics";
import { core } from "../../../Core";
import { KNNsigmoid } from "../../../logic/classifiers/knn";
import { xUtil } from "../../../util/StandAloneUtil";
import { Get } from "../../../util/GetUtil";
import { FingerprintUtil } from "../../../util/FingerprintUtil";

interface trainingData {
  dt: timestamp,
  data: Record<string, rssi>
}
type processedData = Record<string, number>

export class TrainingData {
  trainingData  : trainingData[]  = [];
  processedData : processedData[] = [];

  sortedDeviceIds : string[] = [];
  crownstonesAtCreation = [];

  subscriptions = [];

  startT: timestamp;
  sphereId:   string;
  locationId: string;

  tick = (amountOfPoints : number) => {};

  constructor(sphereId: string, locationId: string) {
    this.sphereId   = sphereId;
    this.locationId = locationId;
  }

  start() {
    this.trainingData          = [];
    this.processedData         = [];
    this.sortedDeviceIds       = [];
    this.crownstonesAtCreation = [];
    this.startT                = Date.now();

    let sphere = Get.sphere(this.sphereId);
    if (sphere) {
      for (let stoneId in sphere.stones) {
        let stone = sphere.stones[stoneId];
        this.crownstonesAtCreation.push(FingerprintUtil.getStoneIdentifierFromStone(stone));
      }
    }

    this._listen();
  }

  _listen() {
    this.subscriptions.push(NativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, this._collect.bind(this)));
  }

  _collect(data: ibeaconPackage[]) {
    let datapoint = {dt: Date.now() - this.startT, data: {}};
    for (let point of data) {
      let id = `${point.major}_${point.minor}`;
      datapoint.data[id] = point.rssi;
    }

    this.trainingData.push(datapoint);

    this.tick(this.trainingData.length);
  }


  abort() {
    this.stop();
  }


  stop() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.subscriptions = [];
  }

  resume() {
    this._listen();
  }

  store() {
    core.store.dispatch({
      type: 'UPDATE_NEW_LOCATION_FINGERPRINT',
      sphereId: this.sphereId,
      locationId: this.locationId,
      data: {
        fingerprintRaw: JSON.stringify(this.trainingData)
      }
    });
  }
}
