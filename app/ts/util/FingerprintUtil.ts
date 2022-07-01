import { core } from "../Core";
import { Get } from "./GetUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "./DataUtil";
import DeviceInfo from "react-native-device-info";
import {KNNsigmoid, processingParameters} from "../logic/classifiers/knn";
import {xUtil} from "./StandAloneUtil";
const sha1 = require('sha-1');

const FINGERPRINT_SCORE_THRESHOLD = 60; // if the quality is below 60%, it will be removed when there is a manual re-train.

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
    if (FingerprintUtil.calculateScore(sphereId, locationId, fingerprintId) >= FINGERPRINT_SCORE_THRESHOLD) {
      return true;
    }
  },


  /**
   * True is we need to gather fingerprints in this location
   * @param sphereId
   * @param locationId
   */
  shouldTrainLocation: function(sphereId: sphereId, locationId: locationId) : boolean {
    let location = Get.location(sphereId, locationId);
    if (!location) { return false; }

    let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
    let state = core.store.getState();

    if (!state.app.indoorLocalizationEnabled) { return false; } // do not show localization if it is disabled
    if (!enoughCrownstonesInLocations)        { return false; } // not enough crownstones to train this room

    if (Object.keys(location.fingerprints.raw).length > 0) {
      let hasGoodFingerprint = false
      for (let fingerprintId in location.fingerprints.raw) {
        if (FingerprintUtil.isFingerprintGoodEnough(sphereId, locationId, fingerprintId)) {
          hasGoodFingerprint = true;
          break;
        }
      }

      if (hasGoodFingerprint) {
        return false; // already have fingerprints in this location
      }
    }

    return true;
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


  /**
   * True is we need to gather fingerprints in this location
   * @param sphereId
   * @param locationId
   */
  shouldTrainLocationNow: function(sphereId: sphereId, locationId: locationId) : boolean {
    if (FingerprintUtil.shouldTrainLocation(sphereId, locationId) === false) {
      return false;
    }

    let sphere = Get.sphere(sphereId);
    if (sphere.state.present   === false) { return false; } // cant train a room when not in the sphere
    if (sphere.state.reachable === false) { return false; } // cant train a room when not in the sphere

    return true;
  },


  getDeviceTypeDescription(): string {
    let state = core.store.getState();

    let deviceId = DeviceInfo.getDeviceId();

    return `${deviceId}_${state.user.userId}`
  },


  getAmountOfCrownstonesInFingerprint(fingerprint : FingerprintData) : number {
    let ids = {};
    for (let datapoint of fingerprint.data) {
      for (let id in datapoint.data){
        ids[id] = true;
      }
    }

    return Object.keys(ids).length;
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
  calculateScore: function(sphereId: string, locationId: string, fingerprintId: string) : number {
    let sphere = Get.sphere(sphereId);
    let location = Get.location(sphereId, locationId);
    if (!sphere || !location) { return 0; }

    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintId);

    let score = 100;

    if (FingerprintUtil.hasInPocketSet(location)) {
      score -= 10;
    }

    if (fingerprint.createdOnDeviceType === null) {
      score -= 20;
    }

    let amountOfCrownstonesAtCreation    = fingerprint.crownstonesAtCreation.length;
    let amountOfCrownstonesInFingerprint = FingerprintUtil.getAmountOfCrownstonesInFingerprint(fingerprint);
    let amountOfCrownstones              = Object.keys(sphere.stones).length;

    if (amountOfCrownstonesInFingerprint < 3) {
      return 10;
    }

     if (amountOfCrownstonesAtCreation < amountOfCrownstones) {
      let ratio = (amountOfCrownstonesAtCreation / amountOfCrownstones) * 100;
      let penalty = (100 - ratio);
      score -= penalty;
    }

    if (FingerprintUtil.requiresTransformation(fingerprint)) {
      if (FingerprintUtil.canTransform(sphereId, fingerprint) === false) {
        // expect that if it can, it has been transformed since this is an automatic process
      }
      else {
        score -= 10;
      }
    }

    console.log('fingerprint, score',fingerprint, score)
    return Math.round(score);
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
    if (alreadyHasProcessed) {
      core.store.dispatch({type: "ADD_PROCESSED_FINGERPRINT", sphereId, locationId, fingerprintProcessedId: processedId, data: processedFingerprint});
    }
    else {
      let newId = xUtil.getUUID();
      core.store.dispatch({type: "ADD_PROCESSED_FINGERPRINT", sphereId, locationId, fingerprintProcessedId: newId, data: processedFingerprint});
    }
  },


  _processFingerprint(sphereId: string, locationId: string, fingerprintRawId: string) : Partial<FingerprintProcessedData> | null {
    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintRawId);
    if (!fingerprint) { return null; }

    let processedFingerprint: Partial<FingerprintProcessedData> = {
      fingerprintId: fingerprintRawId,
      type: fingerprint.type,
      transformState: "NOT_TRANSFORMED_YET",
      crownstonesAtCreation: [...fingerprint.crownstonesAtCreation],
      data: [],
      processingParameterHash: sha1(JSON.stringify(processingParameters)),
      transformedAt: 0,
      processedAt:   Date.now(),
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
      for (let datapoint of measurement.data) {
        for (let identifier in datapoint) {
          datapoint[identifier] = KNNsigmoid(datapoint[identifier]);
        }
      }
    }

    return processedFingerprint;
  },


  copyData(fingeprintData: FingerprintMeasurementData[] | FingerprintProcessedMeasurementData[]) : FingerprintMeasurementData[] | FingerprintProcessedMeasurementData[] {
    let copy = []

    for (let measurement of fingeprintData) {
      let datapoints = [];
      for (let datapoint of measurement.data) [
        datapoints.push({...datapoint})
      ]

      copy.push({
        dt: measurement.dt,
        data: datapoints
      })
    }

    return copy;
  }




}

