import { core } from "../Core";
import { Get } from "./GetUtil";
import DeviceInfo from "react-native-device-info";
import {xUtil} from "./StandAloneUtil";
import {KNNsigmoid, processingParameters} from "../localization/classifiers/knn";
const sha1 = require('sha-1');

export const FINGERPRINT_SCORE_THRESHOLD = 60; // if the quality is below 60%, it will be removed when there is a manual re-train.
export const FINGERPRINT_SIZE_THRESHOLD = 150; // if the quality is below 60%, it will be removed when there is a manual re-train.

export interface FingerprintPenaltyList {
  unknownDeviceType:  number,
  missingCrownstones: number,
  missingTransform: number,
}
export interface PenaltyList extends FingerprintPenaltyList{
  missingInPocket: number,
  insufficientAmountOfData: number,
}

export const FingerprintUtil = {

  requireMoreFingerprintsBeforeLocalizationCanStart: function (sphereId : string) : boolean {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      if (Object.keys(location.fingerprints.raw).length === 0) {
        return true;
      }
    }
    return false;
  },


  hasInPocketSet: function(location: LocationData) : boolean {
    for (let fingerprint of Object.values(location.fingerprints.raw)) {
      if (fingerprint.type === "IN_POCKET") {
        return true;
      }
    }
    return false;
  },


  // check if there are any fingerprints in the location
  hasFingerprints: function(sphereId : string, locationId : string) : boolean {
    let location = Get.location(sphereId, locationId);
    if (!location) { return false; }

    return Object.keys(location.fingerprints.raw).length !== 0;
  },


  /**
   * Get the stone identifier maj_min from a string like this D8B094E7-569C-4BC6-8637-E11CE4221C18_Maj:47912_Min:57777
   */
  getStoneIdentifierFromIBeaconString: function(str : string) : string {
    let parts = str.split("_");
    if (parts.length !== 3) {
      return null;
    }
    return `${parts[1].substr(4)}_${parts[2].substr(4)}`;
  },

  getStoneIdentifierFromStone: function(stone : StoneData) : string {
    return `${stone.config.iBeaconMajor}_${stone.config.iBeaconMinor}`;
  },

  getStoneIdentifierFromIBeaconPackage: function(ibeacon : ibeaconPackage) : string {
    return `${ibeacon.major}_${ibeacon.minor}`;
  },

  isFingerprintGoodEnough: function(sphereId, locationId, fingerprintId) : boolean {
    let score = FingerprintUtil.calculateFingerprintScore(sphereId, locationId, fingerprintId);
    return FingerprintUtil.isScoreGoodEnough(score);
  },

  isScoreGoodEnough: function(score) : boolean {
    if (score >= FINGERPRINT_SCORE_THRESHOLD) {
      return true;
    }
  },


  requiresTransformation: function(fingerprint : FingerprintData) : boolean {
    if (!fingerprint.type) { return false; }

    let deviceType = DeviceInfo.getDeviceId();
    let fingerprintDeviceType = fingerprint.type.split('_')[0];

    if (deviceType !== fingerprintDeviceType) {
      return true;
    }

    return false;
  },

  canTransform: function(sphereId: sphereId, fingerprint : FingerprintData) : boolean {
    // TODO: implement transforms.
    return false;
  },


  getDeviceTypeDescription(): string {
    let state = core.store.getState();

    return `${DeviceInfo.getDeviceId()}_${DeviceInfo.getDeviceType()}_${state.user.userId}`
  },


  calculateFingerprintScore: function(sphereId: string, locationId: string, fingerprintId: string) : number {
    let sphere = Get.sphere(sphereId);
    let location = Get.location(sphereId, locationId);
    if (!sphere || !location) { return 0; }

    let penalties = FingerprintUtil.calculateFingerprintScorePenalties(sphereId, locationId, fingerprintId);

    let score = 100;
    for (let penalty in penalties) {
      score += penalties[penalty];
    }

    return Math.max(0,Math.round(score));
  },

  /**
   * We will give the locations a fingerprint quality score. This is based on the following criteria:
   *
   * - Is there an in-hand fingerprint AND an in-pocket fingerprint? (if not in pocket -10%);
   * - Is there a requirement for transformation? If so, -10% for not transformed, -5% for approximate.
   * - How many crownstones are in the crownstonesAtCreation list of the fingerprint(s)? If less than 3 total, set the quality to 10%, if ratio, set to ratio (mapped 0 .. 80%).
   *   - If mulitple trainingsets are used, the average of the quality scores will be used weighed by the number of datapoints. This will give a better average.
   *
   * If the score (partially) falls below 60%, discard the trainingset upon the next training of the room. If the total quality is above 60%, add the new set to the previous ones.
   * TODO: DECIDE: If there are multiple sets for a location, automatically remove the worst one.
   *
   * @param sphereId
   * @param locationId
   * @param fingerprintId
   */
  calculateFingerprintScorePenalties: function(sphereId: string, locationId: string, fingerprintId: string) : FingerprintPenaltyList {
    let sphere = Get.sphere(sphereId);
    let location = Get.location(sphereId, locationId);

    let penalties : FingerprintPenaltyList = {
      unknownDeviceType:  0,
      missingCrownstones: 0,
      missingTransform:   0,
    };

    if (!sphere || !location) { return penalties; }

    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintId);

    if (fingerprint.createdOnDeviceType === null) {
      penalties.unknownDeviceType = -50;
    }

    let amountOfCrownstonesAtCreation    = Object.keys(fingerprint.crownstonesAtCreation).length;
    let amountOfCrownstones              = Object.keys(sphere.stones).length;

    if (amountOfCrownstonesAtCreation < amountOfCrownstones) {
      let ratio = (amountOfCrownstonesAtCreation / amountOfCrownstones) * 100;
      let penalty = (100 - ratio);
      penalties.missingCrownstones = -penalty;
    }

    if (FingerprintUtil.requiresTransformation(fingerprint)) {
      if (FingerprintUtil.canTransform(sphereId, fingerprint) === false) {
        // expect that if it can, it has been transformed since this is an automatic process
      }
      else {
        penalties.missingTransform = -10;
      }
    }

    return penalties;
  },



  calculateLocationPenalties: function(sphereId: string, locationId: string) : PenaltyList {
    let penalties : PenaltyList = {
      missingInPocket:0,
      unknownDeviceType: 0,
      insufficientAmountOfData: 0,
      missingCrownstones:0,
      missingTransform:0,
    };

    let sphere = Get.sphere(sphereId);
    let location = Get.location(sphereId, locationId);
    if (!sphere || !location) { return penalties; }

    let totalSamples : Record<FingerprintType, number> = {IN_HAND:0, IN_POCKET:0, AUTO_COLLECTED: 0, FIND_AND_FIX: 0};
    let amountOfFingerprints = Object.keys(location.fingerprints.raw).length;

    if (!FingerprintUtil.hasInPocketSet(location)) {
      penalties.missingInPocket = -20;
    }

    // create this here so we have a list of indices to loop over afterwards.
    let fingerprintPenalties;
    for (let fingerprintId in location.fingerprints.raw) {
      fingerprintPenalties = FingerprintUtil.calculateFingerprintScorePenalties(sphereId, locationId, fingerprintId);
      for (let penalty in fingerprintPenalties) {
        penalties[penalty] += fingerprintPenalties[penalty];
      }


      let fingerprint = location.fingerprints.raw[fingerprintId];
      if (totalSamples[fingerprint.type] !== undefined) {
        totalSamples[fingerprint.type] += fingerprint.data.length;
      }
    }

    // average out the penalties
    for (let penalty in fingerprintPenalties) {
      penalties[penalty] /= amountOfFingerprints;
    }

    if (totalSamples.IN_HAND < FINGERPRINT_SIZE_THRESHOLD) {
      penalties.insufficientAmountOfData = -80 * (1-(totalSamples.IN_HAND/FINGERPRINT_SIZE_THRESHOLD));
    }

    return penalties;
  },


  calculateLocationScore: function(sphereId: string, locationId: string) : number {
    let sphere = Get.sphere(sphereId);
    let location = Get.location(sphereId, locationId);
    if (!sphere || !location) { return 0; }

    let score = 100;
    let penalties = FingerprintUtil.calculateLocationPenalties(sphereId, locationId);

    for (let penalty in penalties) {
      score += penalties[penalty];
    }

    return Math.max(0,Math.round(score));
  },


  processFingerprint(sphereId: string, locationId: string, fingerprintRawId: string) : void {
    let location = Get.location(sphereId, locationId);
    if (!location) { return; }

    let alreadyHasProcessed = false;
    let processedId = null;
    for (let processedFingerprintId in location.fingerprints.processed) {
      if (location.fingerprints.processed[processedFingerprintId].fingerprintId === fingerprintRawId) {
        // this fingerprint has already been processed
        alreadyHasProcessed = true;
        processedId = processedFingerprintId;
        break;
      }
    }

    let processedFingerprint = FingerprintUtil._processFingerprint(sphereId, locationId, fingerprintRawId);
    if (!alreadyHasProcessed) {
      processedId = xUtil.getUUID();
    }

    core.store.dispatch({type: "ADD_PROCESSED_FINGERPRINT", sphereId, locationId, fingerprintProcessedId: processedId, data: processedFingerprint});
  },


  _processFingerprint(sphereId: string, locationId: string, fingerprintRawId: string) : Partial<FingerprintProcessedData> | null {
    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintRawId);
    if (!fingerprint) { return null; }

    let processedFingerprint: Partial<FingerprintProcessedData> = {
      fingerprintId:           fingerprintRawId,
      type:                    fingerprint.type,
      transformState:          "NOT_TRANSFORMED_YET",

      crownstonesAtCreation:   {...fingerprint.crownstonesAtCreation},
      processingParameterHash: sha1(JSON.stringify(processingParameters)),

      data:                    [],
      transformedAt:           0,
      processedAt:             Date.now(),
    }

    // copy all the data before modifying it.
    processedFingerprint.data = FingerprintUtil.copyData(fingerprint.data);


    if (FingerprintUtil.requiresTransformation(fingerprint)) {
      if (FingerprintUtil.canTransform(sphereId, fingerprint) === false) {
        processedFingerprint.transformState = "NOT_TRANSFORMED_YET";
      }
      else {
        // TODO: transform the fingerprint
        // processedFingerprint.transformState = "TRANSFORMED_APPROXIMATE";
        // processedFingerprint.transformState = "TRANSFORMED_EXACT";
      }
    }


    // apply sigmoid function.
    for (let measurement of processedFingerprint.data) {
      for (let identifier in measurement.data) {
        measurement.data[identifier] = KNNsigmoid(measurement.data[identifier]);
      }
    }

    return processedFingerprint;
  },


  copyData(fingerprintData: FingerprintMeasurementData[] | FingerprintProcessedMeasurementData[]) : FingerprintMeasurementData[] | FingerprintProcessedMeasurementData[] {
    let copy = []
    for (let measurement of fingerprintData) {
      copy.push({
        dt: measurement.dt,
        data: { ...measurement.data }
      })
    }

    return copy;
  },
}
