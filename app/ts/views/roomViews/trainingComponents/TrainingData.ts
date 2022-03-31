import { NativeBus } from "../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS, TOPICS } from "../../../Topics";
import { core } from "../../../Core";
import { KNNsigmoid } from "../../../logic/classifiers/knn";
import { xUtil } from "../../../util/StandAloneUtil";

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

  tick = (amountOfPoints : number) => {};

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

    this.sortedDeviceIds = Object.keys(this.availableDevices).sort();

    this._process(datapoint);

    this.trainingData.push(datapoint);


    this.tick(this.trainingData.length);
  }

  _process(datapoint: trainingData) {
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
