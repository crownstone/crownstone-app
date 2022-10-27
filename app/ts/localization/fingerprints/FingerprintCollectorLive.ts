import {FingerprintCollector} from "./FingerprintCollector";
import { KNN } from "../classifiers/knn";
import { Get } from "../../util/GetUtil";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../Topics";
import {core} from "../../Core";


export class FingerprintCollectorLive {
  subscriptions = [];
  handleResult  = (result: ClassificationData) => {};

  startTime       : timestamp;
  sphereId        : string;
  locationId      : string;

  collector       : FingerprintCollector;
  classifier      : KNN;

  lastMeasurement : ibeaconPackage[];
  lastClosestSampleData : ChosenClassificationSampleData;


  constructor(sphereId: string, locationId: string, type: FingerprintType) {
    this.sphereId   = sphereId;
    this.locationId = locationId;
    this.collector  = new FingerprintCollector(sphereId, locationId, type);

    this.classifier = new KNN();
    this.initClassifier();
  }


  initClassifier() {
    this.classifier.initialize();

    let sphere = Get.sphere(this.sphereId);
    for (let location of Object.values(sphere.locations)) {
      for (let fingerprint of Object.values(location.fingerprints.processed)) {
        this.classifier.addFingerprint(this.sphereId, location.id, fingerprint);
      }
    }
  }


  start() {
    this._listen();
  }


  _listen() {
    this.subscriptions.push(NativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, this.handleIbeacon.bind(this)));
  }


  stop() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.subscriptions = [];
  }


  handleIbeacon(data: ibeaconPackage[]) {
    let result = this.classifier.classifyWithVerboseData(this.sphereId, data);
    this.lastMeasurement = data;
    this.lastClosestSampleData = result.closest;
    this.handleResult(result);
  }


  deleteLastBestDatapoint() {
    // check if there was a last chosen sample.
    if (this.lastClosestSampleData.fingerprintId === undefined) { return; };

    let processedFingerprint = Get.processedFingerprint(this.sphereId, this.lastClosestSampleData.locationId, this.lastClosestSampleData.fingerprintId);

    // check what the type of the fingerprint is in order to know if we are allowed to remove datapoints from it.
    // We do not allow automatic removal of IN_HAND or IN_POCKET trained datasets. If that's what you want than you'll have to delete all data.
    if (processedFingerprint.type === 'IN_HAND' || processedFingerprint.type === 'IN_POCKET') { return; }

    let rawFingerprintId = processedFingerprint.fingerprintId;
    let rawFingerprint = Get.fingerprint(this.sphereId, this.lastClosestSampleData.locationId, rawFingerprintId);

    // remove the last datapoint from the raw fingerprint.
    let data = rawFingerprint.data.splice(this.lastClosestSampleData.index, 1);

    core.store.dispatch({
      type:"UPDATE_FINGERPRINT_V2",
      sphereId: this.sphereId,
      locationId: this.lastClosestSampleData.locationId,
      fingerprintId: rawFingerprintId,
      data: {data:data}
    });
  }


  collectDatapoint() {
    this.collector.collect(this.lastMeasurement);
    this.classifier.updateFingerprint(this.sphereId, this.locationId, {id: 'LiveData', data: this.collector.trainingDataProcessed});
  }


  store() {
    this.collector.store();
  }

}
