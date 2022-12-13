import { core } from "../Core";
import { Get } from "./GetUtil";
import DeviceInfo from "react-native-device-info";
import {xUtil} from "./StandAloneUtil";
import {KNNsigmoid, processingParameters} from "../localization/classifiers/knn";
import { TransformUtil } from "./TransformUtil";
import {Permissions} from "../backgroundProcesses/PermissionManager";
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

  getOptimizationOptionsInLocation(sphereId: sphereId, locationId: locationId) : {userId: string, deviceId: string, deviceString: string}[] {
    let location = Get.location(sphereId, locationId);
    if (!location) { return []; }

    let myDeviceId = DeviceInfo.getDeviceId();
    let myUserId   = core.store.getState().user.userId;

    let options = [];
    for (let fingerprintId in location.fingerprints.raw) {
      let fingerprint = location.fingerprints.raw[fingerprintId];
      if (!fingerprint.createdByUser || !fingerprint.createdOnDeviceType) { continue; }
      let deviceType = fingerprint.createdOnDeviceType ?? "x_x_x";
      let deviceId = deviceType.split("_")[0];
      if (fingerprint.createdByUser !== myUserId || deviceId !== myDeviceId) {
        options.push({userId: fingerprint.createdByUser, deviceId: deviceId, deviceString: fingerprint.createdOnDeviceType});
      }
    }

    // remove duplicate userIds from the options array
    let uniqueOptions = [];
    let userDeviceMap : Record<string, true> = {};
    for (let option of options) {
      if (userDeviceMap[`${option.userId}_${option.deviceId}`] === undefined) {
        userDeviceMap[`${option.userId}_${option.deviceId}`] = true;
        uniqueOptions.push(option);
      }
    }

    return uniqueOptions;
  },

  getOptimizationOptions(sphereId: sphereId) : {userId: string, deviceId: string, deviceString: string}[] {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return []; }

    let myDeviceId = DeviceInfo.getDeviceId();
    let myUserId   = core.store.getState().user.userId;

    let options = [];
    for (let locationId in sphere.locations) {
      let locationOptions = FingerprintUtil.getOptimizationOptionsInLocation(sphereId, locationId);
      options = options.concat(locationOptions);
    }

    // remove duplicate userIds from the options array
    let uniqueOptions = [];
    let userDeviceMap : Record<string, true> = {};
    for (let option of options) {
      if (userDeviceMap[`${option.userId}_${option.deviceId}`] === undefined) {
        userDeviceMap[`${option.userId}_${option.deviceId}`] = true;
        uniqueOptions.push(option);
      }
    }

    return uniqueOptions;
  },


  requireMoreFingerprintsBeforeLocalizationCanStart: function (sphereId : string) : boolean {
    let sphere = Get.sphere(sphereId);
    if (!sphere) { return false; }

    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      if (Object.keys(location.fingerprints.processed).length === 0) {
        return true;
      }
    }
    return false;
  },


  hasInPocketSet: function(location: LocationData) : boolean {
    for (let fingerprint of Object.values(location.fingerprints.processed)) {
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

  checkAndRemoveBadFingerprints: function(sphereId, locationId) {
    let location = Get.location(sphereId, locationId);
    if (!location) { return; }

    let actions = [];
    for (let fingerprintId in location.fingerprints.raw) {
      if (!FingerprintUtil.isFingerprintGoodEnough(sphereId, locationId, fingerprintId)) {
        actions.push({type:"REMOVE_FINGERPRINT_V2", sphereId, locationId, fingerprintId});
      }
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
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

  canThisFingerprintBeUsed(fingerprint: FingerprintData) : boolean {
    let phoneExclusivity = core.store.getState().app.localization_onlyOwnFingerprints;
    if (phoneExclusivity || fingerprint.exclusive) {
      if (!fingerprint.createdByUser)       { return false; }
      if (!fingerprint.createdOnDeviceType) { return false; }

      // if there is a fingerprint that is exclusive, but not to your phone, do not use it.
      if (fingerprint.createdByUser       !== Get.userId())                               { return false; }
      if (fingerprint.createdOnDeviceType !== FingerprintUtil.getDeviceTypeDescription()) { return false; }
    }

    return true;
  },


  requiresTransformation: function(fingerprint : FingerprintData) : boolean {
    if (!fingerprint.createdOnDeviceType) { return false; }

    let typeArray = (fingerprint.createdOnDeviceType ?? "x_x_x").split("_");

    // the identifier differs per OS, on iOS the deviceID is more relevant, on Android the getModel is more relevant.
    let currentDeviceIdentifier     = DeviceInfo.getDeviceId();
    let fingerprintDeviceIdentifier = typeArray[0]

    return currentDeviceIdentifier !== fingerprintDeviceIdentifier;
  },


  canTransform: function(sphereId: sphereId, fingerprint : FingerprintData) : boolean {
    let state = core.store.getState();
    let myDeviceId = DeviceInfo.getDeviceId();

    if (!fingerprint.createdByUser || !fingerprint.createdOnDeviceType) { return false; }
    let fingerprintDeviceId = fingerprint.createdOnDeviceType.split('_')[0];

    let transformIds = Object.keys(state.transforms);
    for (let transformId of transformIds) {
      let transform = state.transforms[transformId];
      if (transform.fromDevice === myDeviceId && transform.toDevice === fingerprintDeviceId) {
        return true;
      }
    }

    return false;
  },


  getDeviceTypeDescription(): string {
    return `${DeviceInfo.getDeviceId()}_${DeviceInfo.getManufacturerSync()}_${DeviceInfo.getModel()}`;
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
      if (FingerprintUtil.canTransform(sphereId, fingerprint)) {
        // expect that if it can, it has been transformed since this is an automatic process
      }
      else {
        penalties.missingTransform = -20;
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
    let amountOfFingerprints = Object.keys(location.fingerprints.processed).length;

    if (!FingerprintUtil.hasInPocketSet(location)) {
      penalties.missingInPocket = -20;
    }

    // create this here so we have a list of indices to loop over afterwards.
    let fingerprintPenalties;
    for (let fingerprintId in location.fingerprints.raw) {
      let fingerprint = location.fingerprints.raw[fingerprintId];
      if (FingerprintUtil.canThisFingerprintBeUsed(fingerprint) === false) { continue; }

      fingerprintPenalties = FingerprintUtil.calculateFingerprintScorePenalties(sphereId, locationId, fingerprintId);
      for (let penalty in fingerprintPenalties) {
        penalties[penalty] += fingerprintPenalties[penalty];
      }

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


  getProcessFingerprintActions(sphereId: string, locationId: string, fingerprintRawId: string) : DatabaseAction[] {
    let actions : DatabaseAction[] = [];

    let location = Get.location(sphereId, locationId);
    if (!location) { return actions; }

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
    if (!processedFingerprint) {
      // check if there was a processed fingerprint for this raw fingerprint before, if so, delete it.
      let processedFingerprint = Get.processedFingerprintFromRawId(this.sphereId, locationId, fingerprintRawId);
      if (processedFingerprint) {
        actions.push({
          type: "REMOVE_PROCESSED_FINGERPRINT",
          sphereId: sphereId,
          locationId: locationId,
          fingerprintProcessedId: processedFingerprint.id
        });
      }
      return actions;
    }

    if (!alreadyHasProcessed) {
      processedId = xUtil.getUUID();
    }

    actions.push({type: "ADD_PROCESSED_FINGERPRINT", sphereId, locationId, fingerprintProcessedId: processedId, data: processedFingerprint});

    return actions;
  },


  _processFingerprint(sphereId: string, locationId: string, fingerprintRawId: string) : Partial<FingerprintProcessedData> | null {
    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintRawId);
    if (!fingerprint) { return null; }

    if (FingerprintUtil.canThisFingerprintBeUsed(fingerprint) === false) {
      return null;
    }

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
        processedFingerprint.transformState = FingerprintUtil.transformFingerprint(sphereId, locationId, processedFingerprint);
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

  transformFingerprint(sphereId: string, locationId: string, processedFingerprint: Partial<FingerprintProcessedData>) : TransformState {
    let fingerprint = Get.fingerprint(sphereId, locationId, processedFingerprint.fingerprintId);

    let state = core.store.getState();
    let myDeviceId = DeviceInfo.getDeviceId();
    let myUserId   = state.user.userId;

    if (!fingerprint.createdByUser || !fingerprint.createdOnDeviceType) { return "NOT_TRANSFORMED_YET"; }
    let fingerprintDeviceId = fingerprint.createdOnDeviceType.split('_')[0];

    let transformIds = Object.keys(state.transforms);
    let transformed = false;
    for (let transformId of transformIds) {
      let transform = state.transforms[transformId];
      if (transform.fromDevice === fingerprintDeviceId && transform.fromUser === myUserId && transform.toDevice === myDeviceId) {
        processedFingerprint.data = TransformUtil.transformDataset(processedFingerprint.data, transform.transform);
        return "TRANSFORMED_EXACT";
      }
    }

    if (!transformed) {
      for (let transformId of transformIds) {
        let transform = state.transforms[transformId];
        if (transform.fromDevice === fingerprintDeviceId && transform.toDevice === myDeviceId) {
          processedFingerprint.data = TransformUtil.transformDataset(processedFingerprint.data, transform.transform);
          return "TRANSFORMED_APPROXIMATE";
        }
      }
    }

    return "NOT_TRANSFORMED_YET";
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


  deleteAllFingerprints(sphereId: sphereId) {
    let sphere = Get.sphere(this.sphereId);
    let actions = [];
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      for (let fingerprintId in location.fingerprints.raw) {
        if (FingerprintUtil.canIDeleteThisFingerprint(sphereId, locationId, fingerprintId)) {
          actions.push({type:"REMOVE_FINGERPRINT_V2", sphereId: sphereId, locationId: locationId, fingerprintId: fingerprintId });
        }
      }
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  },

  deleteAllUsedFingerprints(sphereId: sphereId) {
    let sphere = Get.sphere(this.sphereId);
    let actions = [];
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      for (let fingerprintId in location.fingerprints.raw) {
        if (FingerprintUtil.canThisFingerprintBeUsed(location.fingerprints.raw[fingerprintId])) {
          actions.push({type:"REMOVE_FINGERPRINT_V2", sphereId: sphereId, locationId: locationId, fingerprintId: fingerprintId });
        }
      }
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  },


  canIDeleteThisFingerprint(sphereId, locationId, fingerprintId) : boolean {
    let state = core.store.getState();
    let fingerprint = Get.fingerprint(sphereId, locationId, fingerprintId);

    // check if the user has permission to delete fingerprints they did not create
    let hasPermission          = Permissions.inSphere(sphereId).canDeleteExternalFingerprints;
    let exclusivityEnabled     = state.app.localization_onlyOwnFingerprints;
    let fingerprintIsExclusive = fingerprint.exclusive;
    let userIsKnown            = fingerprint.createdByUser !== null;
    let deviceIsKnown          = fingerprint.createdOnDeviceType !== null;
    let createdByMe            = fingerprint.createdByUser === Get.userId();
    let createdOnThisPhone     = fingerprint.createdOnDeviceType === FingerprintUtil.getDeviceTypeDescription();

    // anyone can delete a migrated fingerprint (which is defined by user and device being null).
    // these are not shared via the cloud.
    if (!userIsKnown || !deviceIsKnown) {
      return true;
    }

    // if the user has permission to delete other people's fingerprints, they can delete this one as long as it is not exclusive to another user
    if (hasPermission) {
      if (fingerprintIsExclusive && (!createdByMe || !createdOnThisPhone)) {
        return false;
      }
      return true;
    }

    // if you have exclusivity enabled (and don't have permission), you can only delete fingerprints you created on this phone.
    if (exclusivityEnabled) {
      if (!createdByMe || !createdOnThisPhone) {
        return false;
      }
      return true;
    }

    // if you do not have exclusivity enabled, and don't have the permission, you can only delete fingerprints you created.
    if (!createdByMe) {
      return false;
    }

    return true;
  },

  enableExclusivity() {
    let actions : DatabaseAction[] = [];
    // find all raw fingerprints that have been created by me and mark them as exclusive.
    let state = core.store.getState();
    for (let sphereId in state.spheres) {
      let sphere = state.spheres[sphereId];
      for (let locationId in sphere.locations) {
        let location = sphere.locations[locationId];
        for (let fingerprintId in location.fingerprints.raw) {
          let fingerprint = location.fingerprints.raw[fingerprintId];
          if (fingerprint.createdByUser === Get.userId() && fingerprint.createdOnDeviceType === FingerprintUtil.getDeviceTypeDescription()) {
            actions.push({type: "UPDATE_FINGERPRINT_V2", sphereId, locationId, fingerprintId, data: {exclusive: true}});
          }
        }
      }
    }

    core.store.batchDispatch(actions);

    // this is done after the batch dispatch to make sure the processed fingerprints are re-iterated.
    // the order is important here.
    core.store.dispatch({type: "UPDATE_APP_LOCALIZATION_SETTINGS", data: { localization_onlyOwnFingerprints: true }});
  },


  transformsRequired(sphereId: sphereId) {
    let state = core.store.getState();
    let sphere = state.spheres[sphereId];
    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];
      for (let fingerprintId in location.fingerprints.raw) {
        let fingerprint = location.fingerprints.raw[fingerprintId];
        if (FingerprintUtil.requiresTransformation(fingerprint)) {
          if (FingerprintUtil.canTransform(sphereId, fingerprint) === false) {
            return true;
          }
        }
      }
    }
    return false;
  }

}
