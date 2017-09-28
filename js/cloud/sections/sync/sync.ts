import { CLOUD }               from '../../cloudAPI'
import { LOG }                 from '../../../logging/Log'
import { Platform }            from 'react-native'
import { AppUtil }             from "../../../util/AppUtil";
import { syncDevices }         from "./syncDevices";
import { cleanupPowerUsage,
            syncPowerUsage }   from "./syncPowerUsage";
import { syncDown }            from "./syncDown";
import { getTimeDifference }   from "./shared/syncUtil";
import { matchAvailableData }  from "./matchAvailableData";
import { resolveMissingData }  from "./resolveMissingData";
import { syncEvents }          from "./syncEvents";
import {MessageCenter} from "../../../backgroundProcesses/MessageCenter";



/**
 * We claim the cloud is leading for the availability of items.
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const sync = {

  __currentlySyncing: false,

  sync: function (store, background = true) {
    if (this.__currentlySyncing) {
      LOG.info("SYNC: Skip Syncing, sync already in progress.");
      return new Promise((resolve, reject) => { resolve() });
    }

    this.__currentlySyncing = true;

    let state = store.getState();
    let actions = [];
    let options = { background: background };

    if (!state.user.userId) {
      // do not sync if we're not logged in
      return;
    }

    LOG.cloud("SYNC: Start Syncing.");

    // set the authentication tokens
    let userId = state.user.userId;
    let accessToken = state.user.accessToken;
    CLOUD.setAccess(accessToken);
    CLOUD.setUserId(userId);
    let sphereSyncedIds;
    let changedLocations;
    let cloudData;

    let getUserIdCheckError = (retryThisAfterRecovery) => {
      return (err) => {
        // perhaps there is a 401, user token expired or replaced. Retry logging in.
        if (err.status === 401) {
          LOG.warn("Could not verify user, attempting to login again and retry sync.");
          return CLOUD.login({
            email: state.user.email,
            password: state.user.passwordHash,
            background: true,
          })
            .then((response) => {
              CLOUD.setAccess(response.id);
              CLOUD.setUserId(response.userId);
              store.dispatch({type:'USER_APPEND', data: {accessToken: response.id}});
              return retryThisAfterRecovery();
            })
            .catch((err) => {
              LOG.info("SYNC: COULD NOT VERIFY USER -- ERROR", err);
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

    // before we start the sync, sync the events.
    LOG.info("Sync: START Sync Events.");
    return syncEvents(store,background)
      // in case the event sync fails, check if the user accessToken is invalid, try to regain it if that's the case and try again.
      .catch(getUserIdCheckError(() => {
        LOG.info("Sync: RETRY Sync Events.");
        return this.syncEvents(store,background);
      }))
      // download data from cloud.
      .then(() => {
        LOG.info("Sync: DONE with Sync Events.");
        LOG.info("Sync: START Sync Down.");
        return syncDown( userId, options );
    })
      // in case this fails, try renewing the accessToken. It can happen if there are no events that there is no cloud call there and that this
      // is the first call that can return an unauthenticated error.
      .catch(getUserIdCheckError(() => {
        LOG.info("Sync: RETRY Sync Down.");
        return syncDown( userId, options );
      }))
      .then((data: any) => {
        LOG.info("Sync: DONE with Sync Down.");
        cloudData = data;
        LOG.info("Sync: START Sync User.");
        syncUser(store, actions, cloudData.user);
        LOG.info("Sync: DONE Sync User.");
        LOG.info("Sync: START Check Messages.");
        MessageCenter.checkForMessages();
        LOG.info("Sync: DONE Check Messages.");
        LOG.info("Sync: START matchAvailableData.");
        return matchAvailableData(store, actions, cloudData.spheres, cloudData.spheresData);
      })
      .then((sphereSyncedIdsResult) => {
        LOG.info("Sync: DONE matchAvailableData.");
        sphereSyncedIds = sphereSyncedIdsResult;
        LOG.info("Sync: START resolveMissingData.");
        return resolveMissingData(store, actions, sphereSyncedIds, cloudData);
      })
      .then((changedLocationsResult) => {
        LOG.info("Sync: DONE resolveMissingData.");
        changedLocations = changedLocationsResult;
        LOG.info("Sync: START syncKeys.");
        syncKeys(actions, cloudData.keys);
        LOG.info("Sync: DONE syncKeys.");
        LOG.info("Sync: START syncDevices.");
        return syncDevices(store, actions, cloudData.devices)
      })
      .then(() => {
        LOG.info("Sync: DONE syncDevices.");
        LOG.info("Sync: START syncPowerUsage.");
        return syncPowerUsage(state, actions);
      })
      .then(() => {
        LOG.info("Sync: DONE syncPowerUsage.");
        LOG.info("Sync: START cleanupPowerUsage.");
        return cleanupPowerUsage(state, actions);
      })
      // FINISHED SYNCING
      .then(() => {
        LOG.info("SYNC: Finished. Dispatching ", actions.length, " actions!");
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        if (actions.length > 0) {
          store.batchDispatch(actions);
        }

        this.events.emit("CloudSyncComplete");

        if (sphereSyncedIds.addedSphere === true || changedLocations === true) {
          this.events.emit("CloudSyncComplete_spheresChanged");
        }

      })
      .then(() => {
        this.__currentlySyncing = false;
      })
      .catch((err) => {
        this.__currentlySyncing = false;
        LOG.error("SYNC: error during sync:", err);
        throw err;
      })
  }
};



const syncUser = function(store, actions, userData) {
  let state = store.getState();

  let cloudFirmwareVersions = userData.firmwareVersionsAvailable || null;
  let cloudBootloaderVersions = userData.bootloaderVersionsAvailable || null;

  if (
      state.user && cloudFirmwareVersions && cloudBootloaderVersions &&
      (state.user.firmwareVersionsAvailable !== cloudFirmwareVersions || state.user.bootloaderVersionsAvailable !== cloudBootloaderVersions)
    ) {
    actions.push({type:'SET_NEW_FIRMWARE_VERSIONS', data: {firmwareVersionsAvailable: cloudFirmwareVersions, bootloaderVersionsAvailable: cloudBootloaderVersions}})
  }

  if (getTimeDifference(userData, state.user) > 0) {
    actions.push({
      type: 'USER_UPDATE',
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
      }
    });
  }
};



const syncKeys = function(actions, keys) {
  keys.forEach((keySet) => {
    actions.push({type:'SET_SPHERE_KEYS', sphereId: keySet.sphereId, data:{
      adminKey:  keySet.keys.owner  || keySet.keys.admin || null,
      memberKey: keySet.keys.member || null,
      guestKey:  keySet.keys.guest  || null
    }})
  })
};

