import {NATIVE_BUS_TOPICS} from "../Topics";
import {core} from "../Core";
import {FingerprintManager} from "../logic/FingerprintManager";
import {Scheduler} from "../logic/Scheduler";
import {KNN} from "./classifiers/knn";


class LocalizationCoreClass {

  initialized:           boolean = false;
  classifierInitialized: boolean = false;
  localizationEnabled:   boolean = false;

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

  init() {
    if (!this.initialized) {
      this.initialized = true;

      this.nativeSubscriptions.push(core.nativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, (data: ibeaconPackage[]) => {
        this.handleIBeaconAdvertisement(data);
      }));

      this.eventSubscriptions.push(core.eventBus.on('databaseChange', ({change}) => {
        if (change.changeSpheres) {
          this.evaluateFingerprintManagers();
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
      this.initClassifier();
    }
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


    // TODO: check if it's worth it to remove individual fingerprints from the classifier.
    this.initClassifier();
  }



  reset() {
    this.initialized = false;

    for (let unsubscribe of this.nativeSubscriptions) { unsubscribe(); }
    this.nativeSubscriptions = [];

    for (let unsubscribe of this.eventSubscriptions) { unsubscribe(); }
    this.eventSubscriptions = [];

    this.classifier.reset();
  }


  initClassifier() {
    // this timeout ensures that multiple calls of the init due to multiple listeners to the databaseChange event will not result in multiple classifier reinitializations.
    this.initClassifierTimeout()
    this.initClassifierTimeout = Scheduler.setTimeout(() => {

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

      this.classifierInitialized = true;
    }, 10);
  }


  handleIBeaconAdvertisement(data: ibeaconPackage[]) {
    // TODO: decide whether this is better than unsubscribing and resubscribing the nativeBus.
    if (this.classifierInitialized === false) { return; }
    if (this.localizationEnabled   === false) { return; }

    let resultingLabel = this.classifier.classify(data);

    // TODO: insert postprocessor here.
    if (this.presence[resultingLabel.sphereId] === undefined) {
      this.presence[resultingLabel.sphereId] = null;
    }

    if (this.presence[resultingLabel.sphereId] !== resultingLabel.locationId) {
      // leave the previous room

      console.log('resultingLabel', resultingLabel)
      // if (resultingLabel.sphereId) {
      //   core.eventBus.emit('exitRoom', this.presence[resultingLabel.sphereId]);
      // }
      // core.eventBus.emit('enterRoom', resultingLabel);

      this.presence[resultingLabel.sphereId] = resultingLabel.locationId;
    }
  }


  enableLocalization()            {
    if (this.classifierInitialized === false) {
      this.initClassifier()
    }
    this.localizationEnabled = true;
  }

  disableLocalization()           { this.localizationEnabled = false; }

  enterSphere(sphereId: sphereId) { this.presentSpheres[sphereId] = true; }
  exitSphere( sphereId: sphereId) { delete this.presentSpheres[sphereId]; }


  /**
   * A call to this funciton will trigger a changeFingerprint database event upon removal of data from a fingerprint,
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
