import {Bluenet} from "../../../native/libInterface/Bluenet";
import { core } from "../../../core";

class TestRunnerClass {

  testData = {};
  tests = {};
  unsubscribeEvents = [];
  types           : testTypeMap;
  eventMap        : testTypeMap;
  amountThreshold : testTypeMap;

  queue = [];
  failingTimeout = null;

  pendingResolve = null;

  constructor() {
    this.types = {
      ibeacons:            'ibeacons',
      verifiedCrownstones: 'verifiedCrownstones',
      anyCrownstones:      'anyCrownstones',
      setupCrownstones:    'setupCrownstones',
      anyAdvertisement:    'anyAdvertisement',
      nearestCrownstone:   'nearestCrownstone',
    };

    this.eventMap = {
      ibeacons:            core.nativeBus.topics.iBeaconAdvertisement,
      verifiedCrownstones: core.nativeBus.topics.advertisement,
      anyCrownstones:      core.nativeBus.topics.unverifiedAdvertisementData,
      setupCrownstones:    core.nativeBus.topics.nearestSetup,
      anyAdvertisement:    core.nativeBus.topics.crownstoneAdvertisementReceived,
      nearestCrownstone:   core.nativeBus.topics.nearest,
    };

    this.amountThreshold = {
      ibeacons:            1,
      verifiedCrownstones: 1,
      anyCrownstones:      1,
      setupCrownstones:    4,
      anyAdvertisement:    1,
      nearestCrownstone:   10,
    };
  }

  prepare() {
    this.queue = [];
    this._cleanup();

    if (this.pendingResolve !== null) {
      this.pendingResolve();
      this.pendingResolve = null;
    }
  }

  startScanningForTest() {
    Bluenet.startScanning();
  }

  revertScanning() {
    Bluenet.startScanningForCrownstonesUniqueOnly();
  }

  getIBeaconResult(results)            : boolean          { return results[this.types.ibeacons].result;            }
  getIBeaconData(results)              : ibeaconPackage[] { return results[this.types.ibeacons].data;              }
  getVerifiedCrownstoneResult(results) : boolean          { return results[this.types.verifiedCrownstones].result; }
  getAnyCrownstoneResult(results)      : boolean          { return results[this.types.anyCrownstones].result;      }
  getSetupCrownstoneResult(results)    : boolean          { return results[this.types.setupCrownstones].result;    }
  getBleResult(results)                : boolean          { return results[this.types.anyAdvertisement].result;    }
  getNearestResult(results)            : boolean          { return results[this.types.nearestCrownstone].result;   }
  getNearestScans(results)             : nearestStone[]   { return results[this.types.nearestCrownstone].data;     }

  getSearchResultForIbeacon(stoneId, results)          : boolean                 { return results["searchForCrownstone_" + stoneId + "_ibeacon"].result; }
  getSearchRssiForAdvertisment(stoneId, results)       : number                  { return results["searchForCrownstone_" + stoneId + "_advertisement_direct"].rssi;   }
  getSearchResultForAdvertisment(stoneId, results)     : boolean                 { return results["searchForCrownstone_" + stoneId + "_advertisement_direct"].result; }
  getSearchResultForAdvertismentData(stoneId, results) : crownstoneAdvertisement { return results["searchForCrownstone_" + stoneId + "_advertisement_direct"].data; }
  getSearchRssiForUnVerified(stoneId, results)         : number                  { return results["searchForCrownstone_" + stoneId + "_advertisement_otherSphere"].rssi; }
  getSearchResultForUnVerified(stoneId, results)       : boolean                 { return results["searchForCrownstone_" + stoneId + "_advertisement_otherSphere"].result; }
  getSearchResultForViaMesh(stoneId, results)          : boolean                 { return results["searchForCrownstone_" + stoneId + "_advertisement_mesh"].result; }
  getSearchResultForMeshing(stoneId, results)          : boolean                 { return results["searchForCrownstone_" + stoneId + "_advertisement_externalState"].result; }

  addIBeaconTest() {
    this.queue.push({type:this.types.ibeacons});
  }

  addVerifiedCrownstoneTest() {
    this.queue.push({type:this.types.verifiedCrownstones});
  }

  addAnyCrownstoneTest() {
    this.queue.push({type:this.types.anyCrownstones});
  }

  addSetupCrownstoneTest() {
    this.queue.push({type:this.types.setupCrownstones});
  }

  addBleTest() {
    this.queue.push({type:this.types.anyAdvertisement});
  }

  addNearestCheck() {
    this.queue.push({type:this.types.nearestCrownstone});
  }

  addSearchForCrownstone(sphere, stoneId) {
    this.queue.push({type:'searchForCrownstone', sphere: sphere, stoneId: stoneId});
  }

  _cleanup() {
    this.testData = {};
    this.tests = {};
    this.unsubscribeEvents.forEach((unsubscribe) =>  { unsubscribe(); });
    this.unsubscribeEvents = [];

    if (this.failingTimeout !== null) {
      clearTimeout(this.failingTimeout);
    }
    this.failingTimeout = null;
  }

  run(timeout?) {
    return new Promise((resolve, reject) => {
      if (this.pendingResolve !== null) {
        reject("Test already running!");
      }

      this.pendingResolve = resolve;

      this.startScanningForTest();
      this.startTests();

      this.failingTimeout = setTimeout(() => { this.failRemaining(); }, timeout || 8000)
    })
  }

  startTests() {
    this.queue.forEach((task) => {
      if (task.type === 'searchForCrownstone') {
        this._setupSearch(task);
      }
      else {
        this._setupTest(task.type, this.eventMap[task.type])
      }
    })
  }

  evaluateProcess() {
    if (this.pendingResolve !== null) {
      let completed = true;
      Object.keys(this.tests).forEach((test) => {
        let t = this.tests[test];
        if (t.result === null) {
          completed = false;
        }
      });

      if (completed) {
        let result = {};
        Object.keys(this.tests).forEach((test) => {
          result[test] = this.tests[test];
        });
        // clean up
        this._cleanup();

        // empty queue
        this.queue = [];
        this.pendingResolve(result);
        this.pendingResolve = null;

        // scan normally
        this.revertScanning();
      }
    }
  }

  failRemaining() {
    Object.keys(this.tests).forEach((test) => {
      if (this.tests[test].result === null) {
        this.tests[test].result = false;
      }
    });

    this.evaluateProcess();
  }

  _setupTest(label, topic) {
    this.tests[label] = { data:[], result: null };
    let unsubscribeNativeEvent = core.nativeBus.on(topic, (data) => {
      this.tests[label].data.push(data);
      if (this.tests[label].data.length >= this.amountThreshold[label]) {
        this.tests[label].result = true;
        this.evaluateProcess();
        unsubscribeNativeEvent();
      }
    });
    this.unsubscribeEvents.push(unsubscribeNativeEvent);
  }

  _setupSearch(task) {
    this.tests[task.type + "_" + task.stoneId + "_ibeacon"]                     = { result: null };
    this.tests[task.type + "_" + task.stoneId + "_advertisement_direct"]        = { result: null, rssi: null, data: [] };
    this.tests[task.type + "_" + task.stoneId + "_advertisement_otherSphere"]   = { result: null, rssi: null };
    this.tests[task.type + "_" + task.stoneId + "_advertisement_mesh"]          = { result: null };
    this.tests[task.type + "_" + task.stoneId + "_advertisement_externalState"] = { result: null };

    // search for ibeacon signals from this Crownstone
    let unsubIbeacon = core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data) => {
      data.forEach((ibeacon) => {
        let stone = task.sphere.stones[task.stoneId];
        if (ibeacon.uuid.toLowerCase() !== task.sphere.config.iBeaconUUID.toLowerCase() ) { return; }
        if (ibeacon.major              !== stone.config.iBeaconMajor)                     { return; }
        if (ibeacon.minor              !== stone.config.iBeaconMinor)                     { return; }

        unsubIbeacon();
        this.tests[task.type + "_" + task.stoneId + "_ibeacon"] = { result: true };

        this.evaluateProcess()
      })
    });
    this.unsubscribeEvents.push(unsubIbeacon);


    let unsubUnverifiedAdvertisements = core.nativeBus.on(core.nativeBus.topics.unverifiedAdvertisementData,(data) => {
      let stone = task.sphere.stones[task.stoneId];
      // direct but not in sphere perse
      if (data.handle === stone.config.handle) {
        this.tests[task.type + "_" + task.stoneId + "_advertisement_otherSphere"].result = true;
        this.tests[task.type + "_" + task.stoneId + "_advertisement_otherSphere"].rssi   = data.rssi;
        unsubUnverifiedAdvertisements();
        this.evaluateProcess()
      }
    });
    this.unsubscribeEvents.push(unsubUnverifiedAdvertisements);


    // search for advertisements from this Crownstone via mesh and direct
    let unsubAdvertisements = core.nativeBus.on(core.nativeBus.topics.advertisement,(data) => {
      if (!data.serviceData) { return; }
      let stone = task.sphere.stones[task.stoneId];
      // direct
      if (data.handle === stone.config.handle) {
        this.tests[task.type + "_" + task.stoneId + "_advertisement_otherSphere"].result = true;
        this.tests[task.type + "_" + task.stoneId + "_advertisement_otherSphere"].rssi   = data.rssi;
        if (data.serviceData && data.serviceData.stateOfExternalCrownstone) {
          this.tests[task.type + "_" + task.stoneId + "_advertisement_externalState"].result = true;
        }
        else {
          this.tests[task.type + "_" + task.stoneId + "_advertisement_direct"].result = true;
          this.tests[task.type + "_" + task.stoneId + "_advertisement_direct"].data   = data;
          this.tests[task.type + "_" + task.stoneId + "_advertisement_direct"].rssi   = data.rssi;
        }
      }
      // via mesh
      else if (data.serviceData.crownstoneId === stone.config.crownstoneId) {
        if (data.serviceData.stateOfExternalCrownstone === true) {
          this.tests[task.type + "_" + task.stoneId + "_advertisement_mesh"].result = true;
        }
      }

      // done with the search
      if (
        this.tests[task.type + "_" + task.stoneId + "_advertisement_externalState"].result &&
        this.tests[task.type + "_" + task.stoneId + "_advertisement_direct"].result &&
        this.tests[task.type + "_" + task.stoneId + "_advertisement_mesh"].result) {
        unsubAdvertisements();
        unsubUnverifiedAdvertisements();
      }

      this.evaluateProcess()
    });
    this.unsubscribeEvents.push(unsubAdvertisements);

    // search for advertisements from this Crownstone via mesh and direct
  }
}

export const TestRunner = new TestRunnerClass();