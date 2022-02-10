import {AppState} from 'react-native';
import {LOG, LOGi} from "../logging/Log";
import {Bluenet} from "../native/libInterface/Bluenet";
import {BluenetPromiseWrapper} from "../native/libInterface/BluenetPromise";
import {Util} from "./Util";
import {Scheduler} from "../logic/Scheduler";
import {BleUtil} from "./BleUtil";

const MAX_TIMES_TO_POSTPONE = 5;

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

    // do not do anything to the scanning if high frequency scan is on.
    if (BleUtil.highFrequencyScanUsed() === true) {
      LOGi.info("BatterySavingUtil: startNormalUsage will not continue because highFrequencyScanUsed.");
      this._clearPostponedAction();
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

    let allowNormalScanning = appInForeground || (inSphere && notAllHandlesAreKnown === true && this._postponeCount < 10)
    LOG.info("BatterySavingUtil: startNormalUsage, checking execute startNormalUsage, " +
      "appInForeground",       appInForeground,
      "inSphere",              inSphere,
      "notAllHandlesAreKnown", notAllHandlesAreKnown,
      'allowNormalScanning:',  allowNormalScanning
    );

    if (allowNormalScanning) {
      LOGi.info("BatterySavingUtil: startNormalUsage, executing");
      this._clearPostponedAction();

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
      this._postponeBatterySaving(forceNotInSphere);
      return;
    }

    // if possible requirements:
    //  - user is NOT in the foreground AND
    //  - user in a sphere and all handles are known OR
    //  - user not in a sphere

    let appInForeground = AppState.currentState === 'active';
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

    LOG.info("BatterySavingUtil: startBatterySaving, checking execute startBatterySaving, " +
      "appInForeground",  appInForeground,
      "inSphere",            inSphere,
      "allHandlesKnown",     allHandlesKnown,
      "_postponeCount",      this._postponeCount,
    );

    if (appInForeground === false) {
      if (inSphere === false) {
        // battery saving
        this._executeBatterySaving();
      }
      else if (inSphere === true && allHandlesKnown) {
        if (this._postponeCount < MAX_TIMES_TO_POSTPONE) {
          // try again later
          this._postponeBatterySaving(forceNotInSphere);
        }
        else {
          // battery saving
          this._executeBatterySaving();
        }
      }
    }
  }


  _clearPostponedAction() {
    if (this._cancelPostponedBatterySaving) {
      this._cancelPostponedBatterySaving();
    }
    this._cancelPostponedBatterySaving = null;
  }

  _postponeBatterySaving(forceNotInSphere = false) {
    LOG.info("BatterySavingUtil: startBatterySaving, postpone");

    // user is continuing scanning to get all handles. Stop when we know them.
    this._postponeCount++;
    this._clearPostponedAction();
    this._cancelPostponedBatterySaving = Scheduler.scheduleCallback( () => {
      this._cancelPostponedBatterySaving = null;
      this.startBatterySaving(forceNotInSphere);
    }, 60000, 'startBatterySaving');
  }

  _executeBatterySaving() {
    LOG.info("BatterySavingUtil: startBatterySaving, execute");
    this._postponeCount = 0;
    Bluenet.batterySaving(true);
  }
}

export const BatterySavingUtil = new BatterySavingClass();
