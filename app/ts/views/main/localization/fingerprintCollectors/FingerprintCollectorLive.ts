import { NativeBus } from "../../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../../../Topics";
import { Get } from "../../../../util/GetUtil";
import {KNN} from "../../../../localization/classifiers/knn";
import {FingerprintCollector} from "./FingerprintCollector";


export class FingerprintCollectorLive {
  subscriptions = [];
  handleResult  = (distanceMap : Record<locationId, number>) => {};

  startTime       : timestamp;
  sphereId        : string;
  locationId      : string;

  collector       : FingerprintCollector;
  classifier      : KNN;

  lastMeasurement : ibeaconPackage[];


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


  handleIbeacon(data: ibeaconPackage[]) {
    let distanceMap = this.classifier.classifyWithDistanceMap(this.sphereId, data);
    this.lastMeasurement = data;
    this.handleResult(distanceMap);
  }


  collectDatapoint() {
    this.collector.collect(this.lastMeasurement);
    this.classifier.updateFingerprint(this.sphereId, this.locationId, {id: 'LiveData', data: this.collector.trainingDataProcessed});
  }


  stop() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.subscriptions = [];
  }


  store() {
    this.collector.store();
  }

}
