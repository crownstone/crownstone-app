import { CLOUD }                    from '../../cloudAPI'
import {LOG, LOGe, LOGw} from '../../../logging/Log'
import { AppUtil }                  from "../../../util/AppUtil";
import { syncEvents }               from "./syncEvents";
import { NotificationHandler }      from "../../../backgroundProcesses/NotificationHandler";
import { UserSyncer }               from "./modelSyncs/UserSyncer";
import { SphereSyncer }             from "./modelSyncs/SphereSyncer";
import { DeviceSyncer }             from "./modelSyncs/DeviceSyncer";
import { FirmwareBootloaderSyncer } from "./modelSyncs/FirmwareBootloaderSyncer";
import { getGlobalIdMap }           from "./modelSyncs/SyncingBase";
import { KeySyncer }                from "./modelSyncs/KeySyncer";
import { Scheduler }                from "../../../logic/Scheduler";
import { FingerprintSyncer }        from "./modelSyncs/FingerprintSyncer";
import * as Sentry from "@sentry/react-native";
import { PreferenceSyncer }         from "./modelSyncs/PreferencesSyncer";
import { core } from "../../../core";
import { CloudPoller } from "../../../logic/CloudPoller";



/**
 * We claim the cloud is leading for the availability of items.
 * @param core.store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  __currentlySyncing: false,
  __syncTriggerDatabaseEvents: true,

  sync: function (background = true) {
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

    LOG.info("Sync: Start Syncing.");
    CLOUD.__currentlySyncing = true;

    // set the authentication tokens
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;
    CLOUD.setAccessToken(accessToken);
    CLOUD.setUserId(userId);

    core.eventBus.emit("CloudSyncStarting");

    Sentry.addBreadcrumb({
      category: 'sync',
      data: {
        state:'start'
      }
    });

    let reloadOfTrackingRequired = false;
    let globalCloudIdMap = getGlobalIdMap();
    let globalSphereMap = {};

    let actions = [];
    let userSyncer = new UserSyncer(actions, [], globalCloudIdMap);

    LOG.info("Sync: START Sync Events.");
    return syncEvents(core.store)
      // in case the event sync fails, check if the user accessToken is invalid, try to regain it if that's the case and try again.
      .catch(getUserIdCheckError(state, core.store, () => {
        LOG.info("Sync: RETRY Sync Events.");
        return syncEvents(core.store);
      }))
      .then(() => {
        LOG.info("Sync: DONE Sync Events.");
        LOG.info("Sync: START userSyncer sync.");
        return userSyncer.sync(core.store)
      })
      .catch(getUserIdCheckError(state, core.store, () => {
        LOG.info("Sync: RETRY userSyncer Sync.");
        return userSyncer.sync(core.store)
      }))
      .then(() => {
        LOG.info("Sync: DONE userSyncer sync.");
        LOG.info("Sync: START FirmwareBootloader sync.");
        let firmwareBootloaderSyncer = new FirmwareBootloaderSyncer(actions, [], globalCloudIdMap);
        return firmwareBootloaderSyncer.sync(core.store);
      })
      .then(() => {
        LOG.info("Sync: DONE FirmwareBootloader sync.");
        LOG.info("Sync: START SphereSyncer sync.");
        let sphereSyncer = new SphereSyncer(actions, [], globalCloudIdMap, globalSphereMap);
        return sphereSyncer.sync(core.store);
      })
      .then(() => {
        LOG.info("Sync: DONE SphereSyncer sync.");
        LOG.info("Sync: START KeySyncer sync.");
        let keySyncer = new KeySyncer(actions, [], globalCloudIdMap);
        return keySyncer.sync(core.store);
      })
      .then(() => {
        LOG.info("Sync: DONE KeySyncer sync.");
        LOG.info("Sync: START DeviceSyncer sync.");
        let deviceSyncer = new DeviceSyncer(actions, [], globalCloudIdMap);
        return deviceSyncer.sync(state);
      })
      .then(() => {
        LOG.info("Sync: DONE DeviceSyncer sync.");
        LOG.info("Sync: START Fingerprint sync.");
        let fingerprintSyncer = new FingerprintSyncer(actions, [], globalCloudIdMap, globalSphereMap);
        return fingerprintSyncer.sync(state);
      })
      .then((reloadOfTrackingRequiredResult) => {
        reloadOfTrackingRequired = reloadOfTrackingRequiredResult;
        LOG.info("Sync: DONE Fingerprint sync.");
        LOG.info("Sync: START Preferences sync.");
        let preferenceSyncer = new PreferenceSyncer(actions, [], globalCloudIdMap);
        return preferenceSyncer.sync(state);
      })
      // FINISHED SYNCING
      .then(() => {
        LOG.info("Sync: Finished. Dispatching ", actions.length, " actions!");
        let reloadTrackingRequired = false;

        actions.forEach((action) => {
          action.triggeredBySync = true;

          if (CLOUD.__syncTriggerDatabaseEvents === false) {
            action.__noEvents = true
          }

          switch (action.type) {
            case 'ADD_SPHERE':
            case 'REMOVE_SPHERE':
            case 'ADD_LOCATION':
            case 'REMOVE_LOCATION':
              reloadTrackingRequired = true; break;
          }
        });

        if (actions.length > 0) {
          core.store.batchDispatch(actions);
        }

        if (core.store.getState().app.notificationToken === null) {
          LOG.info("Sync: Requesting notification permissions during updating of the device.");
          NotificationHandler.request();
        }

        if (reloadOfTrackingRequired === true) {
          core.eventBus.emit("reloadTracking")
        }

        LOG.info("Sync after: START Executing cloud poll.");
        CloudPoller.poll(true);
        LOG.info("Sync after: DONE Executing cloud poll.");

        return reloadTrackingRequired;
      })
      .then((reloadTrackingRequired) => {
        CLOUD.__currentlySyncing = false;
        CLOUD.__syncTriggerDatabaseEvents = true;
        cancelFallbackCallback();

        Sentry.addBreadcrumb({
          category: 'sync',
          data: {
            state:'success'
          }
        });

        core.eventBus.emit("CloudSyncComplete");

        if (reloadTrackingRequired) {
          core.eventBus.emit("CloudSyncComplete_spheresChanged");
        }

      })
      .catch((err) => {
        LOG.info("Sync: Failed... Could dispatch ", actions.length, " actions!", actions);
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        // if (actions.length > 0) {
        //   core.store.batchDispatch(actions);
        // }

        Sentry.addBreadcrumb({
          category: 'sync',
          data: {
            state:'failed',
            err: err
          }
        });

        CLOUD.__currentlySyncing = false;
        CLOUD.__syncTriggerDatabaseEvents = true;
        cancelFallbackCallback();
        core.eventBus.emit("CloudSyncComplete");
        LOGe.cloud("Sync: error during sync:", err);

        throw err;
      })
  }
};

let getUserIdCheckError = (state, store, retryThisAfterRecovery) => {
  return (err) => {
    // perhaps there is a 401, user token expired or replaced. Retry logging in.
    if (err.status === 401) {
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
          LOG.info("Sync: COULD NOT VERIFY USER -- ERROR", err);
          if (err.status === 401) {
            AppUtil.logOut(store, {title: "Access token expired.", body:"I could not renew this automatically. The app will clean up and exit now. Please log in again."});
          }
        })
    }
    else {
      throw err;
    }
  }
};