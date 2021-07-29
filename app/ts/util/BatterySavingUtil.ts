import { AppState } from 'react-native';
import { LOG } from "../logging/Log";
import { Bluenet } from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { Util } from "./Util";
import { Scheduler } from "../logic/Scheduler";
import {BleUtil} from "./BleUtil";
import { core } from "../Core";

class BatterySavingClass {
  _initialized: boolean = false;
  _cancelPostponedBatterySaving : any = null;

  /**
   * This method is used to check if we should start scanning
   *
   * It can happen that this is called before we enter the sphere, but we're just about to
   * In that case, the provided sphereId will tell the method that we're just about in the sphere.
   * @param sphereId
   */
  startNormalUsage(sphereId = null) {
    // LOGd.info("BatterySavingUtil: startNormalUsage, sphereId: ", sphereId);
    let cancelPostponedScan = () => {
      // LOGd.info("BatterySavingUtil: startNormalUsage, cancelPostponedScan, starting.");
      if (typeof this._cancelPostponedBatterySaving === 'function') {
        // LOGd.info("BatterySavingUtil: startNormalUsage, cancelPostponedScan, started.");
        this._cancelPostponedBatterySaving();
        this._cancelPostponedBatterySaving = null;
      }
    };

    // do not do anything to the scanning if high frequency scan is on.
    if (BleUtil.highFrequencyScanUsed() === true) {
      // LOGd.info("BatterySavingUtil: startNormalUsage, highFrequencyScanUsed.");
      cancelPostponedScan();
      return;
    }


    let state = core.store.getState();

    // if needed requirements:
    //  - app is in foreground OR
    //  - user is in sphere
    //  - not all handles are known

    let appInForeground = AppState.currentState === 'active';
    let inSphereId = Util.data.getPresentSphereId(state) || sphereId;
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
    if (appInForeground || (inSphere && notAllHandlesAreKnown === true)) {
      // LOGd.info("BatterySavingUtil: startNormalUsage, executing");
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

    let state = core.store.getState();

    // if possible requirements:
    //  - user is NOT in the foreground AND
    //  - user in a sphere and all handles are known OR
    //  - user not in a sphere

    let appNotInForeground = AppState.currentState !== 'active';
    let inSphereId = Util.data.getPresentSphereId(state);
    if (forceNotInSphere === true) {
      inSphereId = null;
    }
    let inSphere = inSphereId !== null;
    let allHandlesKnown = true;
    if (inSphere) {
      Util.data.callOnStonesInSphere(inSphereId, (stoneId, stone) => {
        if (!stone.config.handle) {
          allHandlesKnown = false;
        }
      });
    }

    // LOGd.info("BatterySavingUtil: startBatterySaving, checking execute startBatterySaving, appNotInForeground", appNotInForeground, "inSphere", inSphere, "allHandlesKnown", allHandlesKnown, 'total:',appNotInForeground === true && (inSphere === false || (inSphere === true && allHandlesKnown)));
    if (appNotInForeground === true && (inSphere === false || (inSphere === true && allHandlesKnown))) {
      // LOGd.info("BatterySavingUtil: startBatterySaving, execute");
      Bluenet.batterySaving(true);
    }
    else if (!allHandlesKnown && appNotInForeground === true) {
      // user is continuing scanning to get all handles. Stop when we know them.
      this._cancelPostponedBatterySaving = Scheduler.scheduleCallback( () => { this.startBatterySaving(forceNotInSphere); }, 60000, 'startBatterySaving');
    }
  }
}

export const BatterySavingUtil = new BatterySavingClass();