import { Get } from "../../util/GetUtil";
import { FingerprintUtil } from "../../util/FingerprintUtil";
import { canUseIndoorLocalizationInSphere } from "../../util/DataUtil";
import { LocalizationCore } from "../LocalizationCore";
import { core } from "../../Core";


export class FingerprintManager {

  sphereId    : sphereId;
  initialized : boolean = false;

  subscriptions : unsubscriber[] = [];
  stoneIdMap:  Record<stoneId, CrownstoneIdentifier> = {};

  allLocationsHaveProcessedFingerprints : boolean = false;
  phoneExclusivity : boolean = false;

  constructor(sphereId: sphereId) {
    this.sphereId = sphereId;

    // let sphere = Get.sphere(this.sphereId);
    // for (let locationId in sphere.locations) {
    //   core.store.dispatch({type:"REMOVE_ALL_PROCESSED_FINGERPRINTS", sphereId: this.sphereId, locationId});
    //   core.store.dispatch({type:"REMOVE_ALL_FINGERPRINTS_V2",        sphereId: this.sphereId, locationId});
    // }

    this.init();
  }

  generateStoneIdentifierMap() : Record<stoneId, CrownstoneIdentifier> {
    let sphere = Get.sphere(this.sphereId);
    if (!sphere) { this.deinit(); return {}; }

    this.stoneIdMap = {};
    for (let stoneId in sphere.stones) {
      let stone = sphere.stones[stoneId];
      this.stoneIdMap[stoneId] = FingerprintUtil.getStoneIdentifierFromStone(stone);
    }
  }

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      this.phoneExclusivity = core.store.getState().app.localization_onlyOwnFingerprints ?? false;
      /**
       * This should watch for all changes in a sphere that can lead to changes in localization.
       */
      this.subscriptions.push(core.eventBus.on("databaseChange", ({change}) => {
        if (change.addStone && change.addStone.sphereIds[this.sphereId]) {
          this.generateStoneIdentifierMap();
        }

        if (change.removeStone && change.removeStone.sphereIds[this.sphereId]) {
          // removal of stones will possibly require removal of data from existing fingerprints.
          this.removeStoneIdsFromFingerprints(Object.keys(change.removeStone.stoneIds));
        }


        if (change.changeLocalizationAppSettings) {
          if (core.store.getState().app.localization_onlyOwnFingerprints !== this.phoneExclusivity) {
            this.phoneExclusivity = core.store.getState().app.localization_onlyOwnFingerprints;

            // reprocess all fingerprints to tak the phone ecclusivity into account.
            this.reprocessFingerprints();
          }
        }

        if (change.changeTransforms) {
          this.reprocessFingerprints();
        }

        if (change.changeFingerprint && change.changeFingerprint.sphereIds[this.sphereId]) {
          // changes in fingerprints will lead to reprocessing.
          this.checkProcessedFingerprints();
          if (canUseIndoorLocalizationInSphere(this.sphereId)) {
            LocalizationCore.enableLocalization();
          }
        }

        if (change.changeLocations && change.changeLocations.sphereIds[this.sphereId] ||
            change.changeFingerprint && change.changeFingerprint.sphereIds[this.sphereId] ||
            change.changeProcessedFingerprint && change.changeProcessedFingerprint.sphereIds[this.sphereId]) {
           this.allLocationsHaveProcessedFingerprints = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(this.sphereId);
        }
      }))

      this.checkProcessedFingerprints();
    }
  }

  deinit() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
    this.initialized   = false;
  }



  removeStoneIdsFromFingerprints(stoneIds: stoneId[]) {
    // prepare the identifier maps so we can iterate over the data and use that.
    let crownstoneIdentifiers = [];
    for (let stoneId of stoneIds) {
      let identifier = this.stoneIdMap[stoneId];
      if (identifier) {
        crownstoneIdentifiers.push(identifier);
      }
    }

    this.removeCrownstoneIdentifiersFromFingerprints(crownstoneIdentifiers);
  }


  removeCrownstoneIdentifiersFromFingerprints(crownstoneIdentifiers: CrownstoneIdentifier[]) {
    let actions = [];

    // if the sphere does not exist, clean up and stop.
    let sphere = Get.sphere(this.sphereId);
    if (!sphere) { this.deinit(); return; }


    // get a map from the identifier array
    let crownstoneIdentifierMap = {};
    for (let identifier of crownstoneIdentifiers) {
      crownstoneIdentifierMap[identifier] = true;
    }

    // remove all datapoints belonging to the removed stones from all the raw fingerprints;
    for (let location of Object.values(sphere.locations)) {
      for (let fingerprint of Object.values(location.fingerprints.raw)) {
        // remove the crownstoneIdentifiers from the crownstonesAtCreation array of the fingerprint.
        let modified = false;
        let crownstonesAtCreation = {...fingerprint.crownstonesAtCreation};
        for (let identifier of crownstoneIdentifiers) {
          if (crownstonesAtCreation[identifier]) {
            delete crownstonesAtCreation[identifier];
            modified = true;
          }
        }

        // iterate over all the datapoints and remove the ones that belong to the removed stones.
        let copiedData = FingerprintUtil.copyData(fingerprint.data);
        for (let measurement of copiedData) {
          for (let crownstoneIdentifier of crownstoneIdentifiers) {
            modified = true;
            delete measurement.data[crownstoneIdentifier];
          }
        }

        if (modified) {
          actions.push({
            type:"UPDATE_FINGERPRINT_V2",
            sphereId:      this.sphereId,
            locationId:    location.id,
            fingerprintId: fingerprint.id,
            data: {
              crownstonesAtCreation: crownstonesAtCreation,
              data: copiedData
            }
          });
        }
      }
    }

    if (actions.length > 0) {
      core.store.batchDispatch(actions);
    }
  }

  /**
   * check all fingerprints in all spheres and all locations and see if they are processed.
   * if they are not, then we need to process them. If they have been processed before the updated time of the fingerprints,
   * then we need to reprocess them.
   */
  checkProcessedFingerprints() {
    // if the sphere does not exist, clean up and stop.
    let sphere = Get.sphere(this.sphereId);
    if (!sphere) { this.deinit(); return; }

    for (let locationId in sphere.locations) {
      let location = sphere.locations[locationId];

      for (let fingerprint of Object.values(location.fingerprints.raw)) {
        let processedFingerprint = Get.processedFingerprintFromRawId(this.sphereId, locationId, fingerprint.id);
        if (!processedFingerprint || processedFingerprint.processedAt < fingerprint.updatedAt) {
          FingerprintUtil.processFingerprint(this.sphereId, locationId, fingerprint.id);
        }
      }
    }
  }


  getProcessedFingerprints() : Record<locationId, FingerprintProcessedData[]> {
    let result = {};

    // if the sphere does not exist, clean up and stop.
    let sphere = Get.sphere(this.sphereId);
    if (!sphere) { this.deinit(); return {}; }

    for (let location of Object.values(sphere.locations)) {
      result[location.id] = [];
      for (let fingerprint of Object.values(location.fingerprints.processed)) {
        result[location.id].push(fingerprint);
      }
    }

    return result;
  }

  reprocessFingerprints() {
    let sphere = Get.sphere(this.sphereId);
    let actions = [];
    for (let locationId in sphere.locations) {
      actions.push({type:"REMOVE_ALL_PROCESSED_FINGERPRINTS", sphereId: this.sphereId, locationId});
    }
    if (actions.length > 0) {
      core.store.batchDispatch(actions);
      this.checkProcessedFingerprints();
    }
  }

}



