import {NATIVE_BUS_TOPICS} from "../Topics";
import {core} from "../Core";
import {Scheduler} from "../logic/Scheduler";
import {KNN} from "./classifiers/knn";
import { canUseIndoorLocalizationInSphere } from "../util/DataUtil";
import { FingerprintManager } from "./fingerprints/FingerprintManager";
import {
  AMOUNT_OF_CROWNSTONES_IN_VECTOR_FOR_INDOOR_LOCALIZATION
} from "../ExternalConfig";


export class LocalizationCoreClass {

  initialized:            boolean = false;
  classifierInitialized:  boolean = false;
  classifierInitializing: boolean = false;
  localizationEnabled:    boolean = false;
  localizationPaused:     boolean = false;

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
          // TODO: check how this handes downloading a location including fingerprints.
          // this.disableLocalization()
          // TODO: when do we re-enable it?
          return;
        }

        if (change.removeLocation) {
          this.initClassifier();
          //TODO: check if localization needs to be paused since a location might have been added. In that case, not all locations are trained
          // and localication needs to be paused.
          // Another option is that locations have been deleted and we dont have fingerprints anymore.
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

    for (let sphereId in classificationResults) {
      // TODO: insert postprocessor here.
      if (this.presence[sphereId] === undefined) {
        this.presence[sphereId] = null;
      }

      if (this.presence[sphereId] !== classificationResults[sphereId]) {
        // leave the previous room

        if (this.presence[sphereId] !== null) {
          core.eventBus.emit('exitRoom', {sphereId: sphereId, locationId: this.presence[sphereId]});
        }
        core.eventBus.emit('enterRoom',  {sphereId: sphereId, locationId: classificationResults[sphereId]});

        this.presence[sphereId] = classificationResults[sphereId];
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


export const LocalizationCore = new LocalizationCoreClass();
