import { NativeBus } from "../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../../Topics";
import { core } from "../../../Core";
import { KNNsigmoid } from "../../../logic/classifiers/knn";

interface trainingData {
  timestamp: timestamp,
  devices:   Record<string, rssi>
}
type processedData = Record<string, number>

export class TrainingData {
  trainingData  : trainingData[]  = [];
  processedData : processedData[] = [];

  sortedDeviceIds : string[] = [];
  availableDevices = {};

  subscriptions = [];

  sphereId:   string;
  locationId: string;

  tick = () => {};

  constructor(sphereId: string, locationId: string) {
    this.sphereId   = sphereId;
    this.locationId = locationId;
  }

  start() {
    this.trainingData     = [];
    this.processedData    = [];
    this.sortedDeviceIds  = [];
    this.availableDevices = {};
    this._listen();
  }

  _listen() {
    this.subscriptions.push(NativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, this._collect.bind(this)));
  }

  _collect(data: ibeaconPackage[]) {
    let datapoint = {timestamp:Date.now(), devices: {}};
    for (let point of data) {
      let id = `${point.major}_${point.minor}`
      datapoint.devices[id]     = point.rssi;
      this.availableDevices[id] = true;
    }

    this._process(datapoint);

    this.trainingData.push(datapoint);
    this.tick();
  }

  _process(datapoint: trainingData) {
    let processed : processedData = {};
    for (let deviceId in datapoint.devices) {
      processed[deviceId] = KNNsigmoid(datapoint.devices[deviceId]);
    }

    console.log(processed)

    let minDistance = Infinity;
    let c = 0
    for (let existingData of this.processedData) {
      let d = 0;
      for (let deviceId in this.availableDevices) {
        let x = processed[deviceId] ?? 1;
        let y = existingData[deviceId] ?? 1;
        d += 2 * (x*x + y*y - 1.95 * x * y);
      }
      if (d < minDistance) {
        minDistance = d;
        console.log(d, c, existingData)
      }
      c++;
    }

    console.log('distance', minDistance, this.processedData.length);
    this.processedData.push(processed);

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
