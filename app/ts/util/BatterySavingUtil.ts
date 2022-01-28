import {AppState} from 'react-native';
import {LOG, LOGi} from "../logging/Log";
import {Bluenet} from "../native/libInterface/Bluenet";
import {BluenetPromiseWrapper} from "../native/libInterface/BluenetPromise";
import {Util} from "./Util";
import {Scheduler} from "../logic/Scheduler";
import {BleUtil} from "./BleUtil";

class BatterySavingClass {
  _initialized: boolean = false;
  _cancelPostponedBatterySaving : any = null;

  _postponeCount = 0;

  /**
   * This method is used to check if we should start scanning
   *
   * It can happen that this is called before we enter the sphere, but we're just about to
   * In that case, the provided sphereId will tell the method that we're just about in the sphere.
   * @param sphereId
   */
  startNormalUsage(sphereId = null) {
    LOGi.info("BatterySavingUtil: startNormalUsage, sphereId: ", sphereId);
    let cancelPostponedScan = () => {
      LOGi.info("BatterySavingUtil: startNormalUsage, cancelPostponedScan, starting.");
      if (typeof this._cancelPostponedBatterySaving === 'function') {
        LOGi.info("BatterySavingUtil: startNormalUsage, cancelPostponedScan, started.");
        this._cancelPostponedBatterySaving();
        this._cancelPostponedBatterySaving = null;
      }
    };

    // do not do anything to the scanning if high frequency scan is on.
    if (BleUtil.highFrequencyScanUsed() === true) {
      LOGi.info("BatterySavingUtil: startNormalUsage will not continue because highFrequencyScanUsed.");
      cancelPostponedScan();
      return;
    }


    // if needed requirements:
    //  - app is in foreground OR
    //  - user is in sphere
    //  - not all handles are known

    let appInForeground = AppState.currentState === 'active';
    let inSphereId = Util.data.getPresentSphereId() || sphereId;
    let inSphere = inSphereId !== null;
    let notAllHandlesAreKnown = null;
    if (inSphere) {
      Util.data.callOnStonesInSphere(inSphereId, (stoneId, stone) => {
        if (!stone.config.handle) {
          notAllHandlesAreKnown = true;
        }
      });
    }

    // LOGd.info("BatterySavingUtil: startNormalUsage, checking execute startNormalUsage, appInForeground", appInForeground, "inSphere", inSphere, "notAllHandlesAreKnown", notAllHandlesAreKnown, 'total:',appInForeground && inSphere || inSphere && notAllHandlesAreKnown === true);

    let allowNormalScanning = appInForeground || (inSphere && notAllHandlesAreKnown === true)
    LOG.info("BatterySavingUtil: startNormalUsage, checking execute startNormalUsage, " +
      "appInForeground",       appInForeground,
      "inSphere",              inSphere,
      "notAllHandlesAreKnown", notAllHandlesAreKnown,
      'allowNormalScanning:',  allowNormalScanning
    );

    if (allowNormalScanning) {
      LOGi.info("BatterySavingUtil: startNormalUsage, executing");
      this._postponeCount = 0;
      cancelPostponedScan();
      Bluenet.batterySaving(false);
      BluenetPromiseWrapper.isReady().then(() => {
        LOG.info("BatterySavingUtil: startNormalUsage, Start Scanning.");
        Bluenet.startScanningForCrownstonesUniqueOnly();
      });
    }
  }


  /**
   * This will stop scanning if that is possible. Reasons not to stop scanning are:
   * - not all handles are known and the app wants to stop because app goes into the background.
   *
   * If that is the case, we schedule a check a minute later if we can stop then.
   *
   * We can call this before we leave the last sphere. In that case we can use the forceNotInSphere.
   * @param forceNotInSphere
   */
  startBatterySaving(forceNotInSphere = false) {
    // LOGd.info("BatterySavingUtil: startBatterySaving, forceNotInSphere: ", forceNotInSphere);
    // do not do anything to the scanning if high frequency scan is on.
    if (BleUtil.highFrequencyScanUsed() === true) {
      // try again later tho.
      this._cancelPostponedBatterySaving = Scheduler.scheduleCallback( () => { this.startBatterySaving(forceNotInSphere); }, 60000, 'startBatterySaving');
      return;
    }

    // if possible requirements:
    //  - user is NOT in the foreground AND
    //  - user in a sphere and all handles are known OR
    //  - user not in a sphere

    let appNotInForeground = AppState.currentState !== 'active';
    let inSphereId = Util.data.getPresentSphereId();
    if (forceNotInSphere === true) {
      inSphereId = null;
    }
    let inSphere = inSphereId !== null;
    let allHandlesKnown = true;
    if (inSphere) {
      Util.data.callOnStonesInSphere(inSphereId, (stoneId, stone) => {
        if (!stone.config.handle) {
          LOG.info("BatterySavingUtil: startBatterySaving: not all handles known. Missing for", stone.config.name);
          allHandlesKnown = false;
        }
      });
    }

    let allowBatterySaving = appNotInForeground === true &&
                            (inSphere === false || (inSphere === true && allHandlesKnown)) &&
                            this._postponeCount < 10;

    LOG.info("BatterySavingUtil: startBatterySaving, checking execute startBatterySaving, " +
      "appNotInForeground",  appNotInForeground,
      "inSphere",            inSphere,
      "allHandlesKnown",     allHandlesKnown,
      "_postponeCount",      this._postponeCount,
      'allowBatterySaving:', allowBatterySaving
    );
    if (allowBatterySaving) {
      LOG.info("BatterySavingUtil: startBatterySaving, execute");
      this._postponeCount = 0;
      Bluenet.batterySaving(true);
    }
    else if (!allHandlesKnown && appNotInForeground === true) {
      // user is continuing scanning to get all handles. Stop when we know them.
      this._postponeCount++;
      this._cancelPostponedBatterySaving = Scheduler.scheduleCallback( () => {
        this._cancelPostponedBatterySaving = null;
        this.startBatterySaving(forceNotInSphere);
      }, 60000, 'startBatterySaving');
    }
  }
}

export const BatterySavingUtil = new BatterySavingClass();
