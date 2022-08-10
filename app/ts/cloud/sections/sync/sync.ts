import {CLOUD} from '../../cloudAPI'
import {LOG, LOGe, LOGw} from '../../../logging/Log'
import {AppUtil} from "../../../util/AppUtil";
import {syncEvents} from "./syncEvents";
import {NotificationHandler} from "../../../backgroundProcesses/NotificationHandler";
import {SphereSyncer} from "./modelSyncs/SphereSyncer";
import {DeviceSyncer} from "./modelSyncs/DeviceSyncer";
import {getSyncIdMap} from "./modelSyncs/SyncingBase";
import {Scheduler} from "../../../logic/Scheduler";
// import * as Sentry from "@sentry/react-native";
import {PreferenceSyncer} from "./modelSyncs/PreferencesSyncer";
import {core} from "../../../Core";
import {CloudPoller} from "../../../logic/CloudPoller";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {xUtil} from "../../../util/StandAloneUtil";
import {SyncNext} from "../newSync/SyncNext";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import { AppState } from "react-native";


/**
 * We claim the cloud is leading for the availability of items.
 * @param core.store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  __currentlySyncing: false,
  __syncTriggerDatabaseEvents: true,
  lastSyncTimestamp: 0,

  sync: function (background = true, skipPermissions = false) {
    if (CLOUD.__currentlySyncing) {
      LOG.info("SYNC: Skip Syncing, sync already in progress.");
      return new Promise((resolve, reject) => { resolve(true) });
    }

    let state = core.store.getState();
    if (!state.user.userId) {
      // do not sync if we're not logged in
      return;
    }

    let cancelFallbackCallback = Scheduler.scheduleBackgroundCallback(() => {
      if (CLOUD.__currentlySyncing === true) {
        CLOUD.__currentlySyncing = false;
      }
    }, 30000);

    LOG.info("Sync: Start Syncing. Current app state:", AppState.currentState);
    CLOUD.__currentlySyncing = true;

    // set the authentication tokens
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;
    CLOUD.setAccessToken(accessToken);
    CLOUD.setUserId(userId);

    core.eventBus.emit("CloudSyncStarting");

    // Sentry.addBreadcrumb({
    //   category: 'sync',
    //   data: {
    //     state:'start'
    //   }
    // });

    let globalCloudIdMap = getSyncIdMap();
    let syncSphereIdMap = {};

    let initialPermissionLevels = Permissions.getLevels(state)

    let actions = [];
    LOG.info("Sync: START syncEvents.");
    return syncEvents(core.store)
      // in case the event sync fails, check if the user accessToken is invalid, try to regain it if that's the case and try again.
      .catch(getUserIdCheckError(state, core.store, () => {
        LOG.info("Sync: RETRY syncEvents.");
        return syncEvents(core.store);
      }))
      .then(() => {
        LOG.info("Sync: DONE syncEvents.");
        LOG.info("Sync: START SphereSyncer sync.");
        let sphereSyncer = new SphereSyncer(actions, [], globalCloudIdMap);
        return sphereSyncer.sync(core.store);
      })
      .catch(getUserIdCheckError(state, core.store, () => {
        LOG.info("Sync: RETRY userSyncer Sync.");
        let sphereSyncer = new SphereSyncer(actions, [], globalCloudIdMap);
        return sphereSyncer.sync(core.store);
      }))
      .then(() => {
        return SyncNext.sync([
          'bootloaders',
          'firmwares',
          'fingerprints',
          'hubs',
          'locations',
          'keys',
          'sphereUsers',
          'scenes',
          // 'spheres',
          'stones',
          'toons',
          'user',
        ], actions, globalCloudIdMap);
      })
      .then((sphereIdMap) => {
        syncSphereIdMap = sphereIdMap;
        LOG.info("Sync: DONE Next sync.");
        LOG.info("Sync: START DeviceSyncer sync.");
        let deviceSyncer = new DeviceSyncer(actions, [], globalCloudIdMap);
        return deviceSyncer.sync(state);
      })
      .then(() => {
        LOG.info("Sync: DONE Fingerprint sync.");
        LOG.info("Sync: START Preferences sync.");
        let preferenceSyncer = new PreferenceSyncer(actions, [], globalCloudIdMap);
        return preferenceSyncer.sync(state);
      })
      // FINISHED SYNCING
      .then(() => {
        LOG.info("Sync: Finished. Dispatching ", actions.length, " actions!");

        actions.forEach((action) => {
          action.triggeredBySync = true;

          if (CLOUD.__syncTriggerDatabaseEvents === false) {
            action.__noEvents = true
          }
        });


        // log a map for the debugging process.
        if (new Date(CLOUD.lastSyncTimestamp).getDate() !== new Date().getDate() || CLOUD.lastSyncTimestamp === 0) {
          MapProvider.logMap();
        }
        CLOUD.lastSyncTimestamp = Date.now();

        if (actions.length > 0) {
          core.store.batchDispatch(actions);
        }

        if (core.store.getState().app.notificationToken === null && skipPermissions !== false) {
          LOG.info("Sync: Requesting notification permissions during updating of the device.");
          NotificationHandler.request();
        }

        LOG.info("Sync after: START Executing cloud poll.");
        CloudPoller.poll(true);
        LOG.info("Sync after: DONE Executing cloud poll.");

        // update permissions
        let syncedState = core.store.getState();
        let syncedPermissionLevels = Permissions.getLevels(syncedState)
        if (xUtil.deepCompare(initialPermissionLevels, syncedPermissionLevels) === false) {
          core.eventBus.emit("permissionsHaveBeenUpdated");
        }

      })
      .then(() => {
        CLOUD.__currentlySyncing = false;
        CLOUD.__syncTriggerDatabaseEvents = true;
        cancelFallbackCallback();

        // Sentry.addBreadcrumb({
        //   category: 'sync',
        //   data: {
        //     state:'success'
        //   }
        // });

        core.eventBus.emit("CloudSyncComplete");

        console.log("SYNC COMPLETE!")

      })
      .catch((err) => {
        LOG.info("Sync: Failed... Could dispatch ", actions.length, " actions!", actions);
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        // if (actions.length > 0) {
        //   core.store.batchDispatch(actions);
        // }

        // Sentry.addBreadcrumb({
        //   category: 'sync',
        //   data: {
        //     state:'failed',
        //     err: err
        //   }
        // });

        CLOUD.__currentlySyncing = false;
        CLOUD.__syncTriggerDatabaseEvents = true;
        cancelFallbackCallback();
        core.eventBus.emit("CloudSyncComplete");
        LOGe.cloud("Sync: error during sync:", err?.message);

        throw err;
      })
  }
};

let getUserIdCheckError = (state, store, retryThisAfterRecovery) => {
  return (err) => {
    // perhaps there is a 401, user token expired or replaced. Retry logging in.
    if (err?.status === 401) {
      LOGw.cloud("Could not verify user, attempting to login again and retry sync.");
      return CLOUD.login({
        email: state.user.email,
        password: state.user.passwordHash,
        background: true,
      })
        .then((response) => {
          CLOUD.setAccessToken(response.id);
          CLOUD.setUserId(response.userId);
          core.store.dispatch({type:'USER_APPEND', data: {accessToken: response.id}});
          return retryThisAfterRecovery();
        })
        .catch((err) => {
          LOG.info("Sync: COULD NOT VERIFY USER -- ERROR", err?.message);
          if (err?.status === 401) {
            AppUtil.logOut(store, {title: "Access token expired.", body:"I could not renew this automatically. The app will clean up and exit now. Please log in again."});
          }
        })
    }
    else {
      throw err;
    }
  }
};

