import {FingerprintCollector} from "./FingerprintCollector";
import { KNN } from "../classifiers/knn";
import { Get } from "../../util/GetUtil";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../Topics";


export class FingerprintAppender {
  subscriptions = [];
  handleResult  = (distanceMap) => {};

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

  loadCollectedData(data: ibeaconPackage[][]) {
    for (let measurement of data) {
      let classificationResults = this.classifier.classify(measurement);
      this.lastMeasurement = measurement;
      this.handleResult(classificationResults);
    }
  }


  collectDatapoint() {
    this.collector.collect(this.lastMeasurement);
    this.classifier.updateFingerprint(this.sphereId, this.locationId, {id: 'LiveData', data: this.collector.trainingDataProcessed});
  }


  store() {
    this.collector.store();
  }

}
