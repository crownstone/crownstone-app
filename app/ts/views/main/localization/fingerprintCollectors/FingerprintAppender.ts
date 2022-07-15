import { NativeBus } from "../../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../../../Topics";
import { Get } from "../../../../util/GetUtil";
import { FingerprintUtil } from "../../../../util/FingerprintUtil";
import {KNN} from "../../../../localization/classifiers/knn";

/**
 * This class is used to house a classifier, go over a list of samples and one by one insert them as a fingerprint.
 * Each sample is classified and on a mistake, we add the sample to the fingerprint. We reload that fingerprint into the classifier and continue.
 */
export class FingerprintAppender {
  // trainingData           : trainingData[]  = [];
  // trainingDataProcessed  : trainingData[]  = [];
  //
  // crownstonesAtCreation : Record<CrownstoneIdentifier, true> = {};
  //
  // subscriptions = [];
  //
  // startTime: timestamp;
  // sphereId:   string;
  // locationId: string;
  //
  // tick = (distanceMap : Record<locationId, number>) => {};
  //
  // type: FingerprintType;
  //
  // classifier : KNN;
  //
  // lastMeasurement : ibeaconPackage[];
  //
  // constructor(sphereId: string, locationId: string, type: FingerprintType) {
  //   this.sphereId   = sphereId;
  //   this.locationId = locationId;
  //   this.type       = type;
  //
  //   this.classifier = new KNN();
  //   this.initClassifier();
  // }
  //
  //
  // initClassifier() {
  //   this.classifier.initialize();
  //
  //   let sphere = Get.sphere(this.sphereId);
  //   for (let location of Object.values(sphere.locations)) {
  //     for (let fingerprint of Object.values(location.fingerprints.processed)) {
  //       this.classifier.addFingerprint(this.sphereId, location.id, fingerprint);
  //     }
  //   }
  // }
  //
  //
  // start() {
  //   this.trainingData          = [];
  //   this.crownstonesAtCreation = {};
  //   this.startTime             = Date.now();
  //
  //   let sphere = Get.sphere(this.sphereId);
  //   if (sphere) {
  //     for (let stoneId in sphere.stones) {
  //       let stone = sphere.stones[stoneId];
  //       this.crownstonesAtCreation[FingerprintUtil.getStoneIdentifierFromStone(stone)] = true;
  //     }
  //   }
  //
  // }
  //
  //
  //
  // handleIbeacon(data: ibeaconPackage[]) {
  //   let distanceMap = this.classifier.classifyWithDistanceMap(this.sphereId, data);
  //   let locationIds = Object.keys(distanceMap);
  //   locationIds.sort((a, b) => {
  //     return distanceMap[a] - distanceMap[b];
  //   });
  //
  //   this.lastMeasurement = data;
  //
  // }
  //
  //


}
