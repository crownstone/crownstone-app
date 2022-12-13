import {NATIVE_BUS_TOPICS} from "../Topics";
import {core} from "../Core";
import {Scheduler} from "../logic/Scheduler";
import {KNN} from "./classifiers/knn";
import { canUseIndoorLocalizationInSphere } from "../util/DataUtil";
import { FingerprintManager } from "./fingerprints/FingerprintManager";
import {
  AMOUNT_OF_CROWNSTONES_IN_VECTOR_FOR_INDOOR_LOCALIZATION
} from "../ExternalConfig";
import {LOGi} from "../logging/Log";


export class LocalizationCoreClass {

  initialized:            boolean = false;
  classifierInitialized:  boolean = false;
  classifierInitializing: boolean = false;
  localizationEnabled:    boolean = false;
  localizationPaused:     boolean = false;

  classificationHistory: { [sphereId: string]: locationId[] } = {};

  initClassifierTimeout = () => {}

  classifier : KNN;

  presentSpheres : Record<sphereId, boolean> = {};

  nativeSubscriptions: unsubscriber[] = [];
  eventSubscriptions:  unsubscriber[] = [];

  fingerprintManagers : Record<sphereId, FingerprintManager> = {};

  presence : Record<sphereId, locationId | null> = {};

  constructor() {
    this.classifier = new KNN();
  }

  async init() {
    if (!this.initialized) {
      this.initialized = true;

      this.nativeSubscriptions.push(core.nativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, (data: ibeaconPackage[]) => {
        this.handleIBeaconAdvertisement(data);
      }));

      this.eventSubscriptions.push(core.eventBus.on('databaseChange', ({change}) => {
        if (change.changeSpheres) {
          this.evaluateFingerprintManagers();
          this.initClassifier();
          return;
        }

        if (change.addLocation) {
          // we have a location without fingerprints, disable localization
          // we do not have to disable localization since the classifiy will check for missing fingerprints.
          return;
        }

        if (change.removeLocation) {
          this.initClassifier();
          return;
        }

        if (change.changeStones) {
          // when the stones change, the classifier HAS to be reinitialized because the vector sizes have changed.
          this.initClassifier();
          return;
        }

        if (change.changeProcessedFingerprint) {
          // Fingerprint has been updated. The fingerprints in the classifier should be reloaded.
          this.initClassifier()
          return;
        }
      }));

      this.evaluateFingerprintManagers();
      await this.initClassifier();
    }
  }

  getCurrentLocation(sphereId: sphereId) : locationId | null | undefined {
    return this.presence[sphereId];
  }

  evaluateFingerprintManagers() {
    let spheres = core.store.getState().spheres;

    // add managers for new spheres
    for (let sphereId in spheres) {
      if (this.fingerprintManagers[sphereId] === undefined) {
        this.fingerprintManagers[sphereId] = new FingerprintManager(sphereId);
      }
    }

    // remove managers from deleted spheres
    for (let sphereId in this.fingerprintManagers) {
      if (spheres[sphereId] === undefined) {
        this.fingerprintManagers[sphereId].deinit();
        delete this.fingerprintManagers[sphereId];
      }
    }
  }

  reset() {
    this.initialized = false;

    for (let unsubscribe of this.nativeSubscriptions) { unsubscribe(); }
    this.nativeSubscriptions = [];

    for (let unsubscribe of this.eventSubscriptions) { unsubscribe(); }
    this.eventSubscriptions = [];

    this.classifier.reset();
  }

  initClassifier() : Promise<void> {
    if (this.classifierInitializing) { return Promise.resolve(); }

    this.classifierInitializing = true;

    // this timeout ensures that multiple calls of the init due to multiple listeners to the databaseChange event will not result in multiple classifier reinitializations.
    return new Promise((resolve, reject) => {
      this.initClassifierTimeout();
      this.initClassifierTimeout = Scheduler.setTimeout(() => {
        LOGi.info("LocalizationCore: Initializing classifier");
        this._initClassifier();
        resolve();
      }, 10);
    })
  }


  _initClassifier() {
    this.classifier.reset()
    this.classifier.initialize();

    for (let sphereId in this.fingerprintManagers) {
      let fingerprints = this.fingerprintManagers[sphereId].getProcessedFingerprints();
      for (let locationId in fingerprints) {
        for (let fingerprint of fingerprints[locationId]) {
          this.classifier.addFingerprint(sphereId, locationId, fingerprint);
        }
      }
    }

    this.classifierInitialized  = true;
    this.classifierInitializing = false;
  }


  pauseLocalization() {
    this.localizationPaused = true;
  }

  resumeLocalization() {
    this.localizationPaused = false;
  }


  handleIBeaconAdvertisement(data: ibeaconPackage[]) {
    if (this.classifierInitialized === false) { return; }
    if (this.localizationEnabled   === false) { return; }
    if (this.localizationPaused    === true)  { return; }

    if (data.length === 0) { return;}
    if (!canUseIndoorLocalizationInSphere(data[0].referenceId)) { return; }

    if (data.length < AMOUNT_OF_CROWNSTONES_IN_VECTOR_FOR_INDOOR_LOCALIZATION) {
      return;
    }

    let classificationResults = this.classifier.classify(data);

    let postProcessingStrategy = core.store.getState().app.localization_temporalSmoothingMethod;


    for (let sphereId in classificationResults) {
      if (this.classificationHistory[sphereId] === undefined) {
        this.classificationHistory[sphereId] = [];
      }

      this.classificationHistory[sphereId].push(classificationResults[sphereId]);
      if (this.classificationHistory[sphereId].length > 10) {
        this.classificationHistory[sphereId].shift();
      }
      let result = classificationResults[sphereId];

      switch (postProcessingStrategy) {
        case "NONE": break;
        case "SEQUENTIAL_2":
          result = getSequentialTwoResult(this.classificationHistory[sphereId]);
          break;
        case "BEST_OUT_OF_5":
          result = getBestOutOfN(this.classificationHistory[sphereId], 5);
          break;
        case "BEST_OUT_OF_10":
          result = getBestOutOfN(this.classificationHistory[sphereId], 10);
          break;
      }


      // Atleast give an initial estimate of the location before doing any smoothing.
      if (this.presence[sphereId] === undefined) {
        this.presence[sphereId] = null;
        result = result ?? classificationResults[sphereId];
      }

      if (result == null) {
        continue;
      }

      if (this.presence[sphereId] !== result) {
        // leave the previous room

        if (this.presence[sphereId] !== null) {
          core.eventBus.emit('exitRoom', {sphereId: sphereId, locationId: this.presence[sphereId]});
        }
        core.eventBus.emit('enterRoom',  {sphereId: sphereId, locationId: result});

        this.presence[sphereId] = result;
      }
    }

    return classificationResults;
  }


  enableLocalization() {
    let state = core.store.getState();
    if (state.app.indoorLocalizationEnabled === false) { return; }

    if (this.classifierInitialized === false) { this.initClassifier(); }
    this.localizationEnabled = true;
  }

  disableLocalization()           { this.localizationEnabled = false;     }
  enterSphere(sphereId: sphereId) { this.presentSpheres[sphereId] = true; }
  exitSphere( sphereId: sphereId) { delete this.presentSpheres[sphereId]; }


  /**
   * A call to this function will trigger a changeFingerprint database event upon removal of data from a fingerprint,
   *  which will trigger a changeProcessedFingerprint database event in the FingerprintManager.
   * This event will then reinitialize the classifier.
   * @param sphereId
   * @param stoneId
   */
  crownstoneWasMoved(sphereId: sphereId, stoneId: stoneId) {
    if (this.fingerprintManagers[sphereId] !== undefined) {
      this.fingerprintManagers[sphereId].removeStoneIdsFromFingerprints([stoneId]);
    }
  }
}


function getSequentialTwoResult(locationArray: locationId[]) : locationId | null {
  if (locationArray.length < 2) { return locationArray[0]; }
  // check if the last two entries are the same.
  if (locationArray[locationArray.length-1] === locationArray[locationArray.length-2]) {
    return locationArray[locationArray.length-1];
  }
  return null;
}


function getBestOutOfN(locationArray: locationId[], N: number) : locationId | null {
  // get the last N from the array
  let lastN = locationArray.slice(-N);
  // count the number of occurences of each location.
  let counts = {};
  for (let location of lastN) {
    if (counts[location] === undefined) { counts[location] = 0; }
    counts[location]++;
  }

  // find the location with the highest count.
  let bestLocation = null;
  let bestCount = 0;
  for (let location in counts) {
    if (counts[location] > bestCount) {
      bestLocation = location;
      bestCount = counts[location];
    }
  }
  return bestLocation;
}


export const LocalizationCore = new LocalizationCoreClass();
