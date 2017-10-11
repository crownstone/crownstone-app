import { CLOUD }               from '../../cloudAPI'
import { LOG }                 from '../../../logging/Log'
import { Platform }            from 'react-native'
import { AppUtil }             from "../../../util/AppUtil";
import { cleanupPowerUsage, syncPowerUsage }   from "./syncPowerUsage";
import { syncEvents }          from "./syncEvents";
import {MessageCenter} from "../../../backgroundProcesses/MessageCenter";
import {NotificationHandler} from "../../../backgroundProcesses/NotificationHandler";
import {UserSyncer} from "./modelSyncs/UserSyncer";
import {SphereSyncer} from "./modelSyncs/SphereSyncer";
import {DeviceSyncer} from "./modelSyncs/DeviceSyncer";
import {getGlobalIdMap} from "./modelSyncs/SyncingBase";
import {eventBus} from "../../../util/EventBus";
import {KeySyncer} from "./modelSyncs/KeySyncer";



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

    let globalCloudIdMap = getGlobalIdMap();
    let actions = [];
    let userSyncer = new UserSyncer(actions, [], globalCloudIdMap);

    LOG.info("Sync: START Sync Events.");
    return syncEvents(store)
      // in case the event sync fails, check if the user accessToken is invalid, try to regain it if that's the case and try again.
      .catch(getUserIdCheckError(state, store, () => {
        LOG.info("Sync: RETRY Sync Events.");
        return this.syncEvents(store);
      }))
      .then(() => {
        LOG.info("Sync: DONE Sync Events.");
        LOG.info("Sync: START userSyncer sync.");
        return userSyncer.sync(store)
      })
      .catch(getUserIdCheckError(state, store, () => {
        LOG.info("Sync: RETRY userSyncer Sync.");
        return userSyncer.sync(store)
      }))
      .then(() => {
        LOG.info("Sync: DONE userSyncer sync.");
        LOG.info("Sync: START SphereSyncer sync.");
        let sphereSyncer = new SphereSyncer(actions, [], globalCloudIdMap);
        return sphereSyncer.sync(store);
      })
      .then(() => {
        LOG.info("Sync: DONE SphereSyncer sync.");
        LOG.info("Sync: START KeySyncer sync.");
        let keySyncer = new KeySyncer(actions, [], globalCloudIdMap);
        return keySyncer.sync();
      })
      .then(() => {
        LOG.info("Sync: DONE KeySyncer sync.");
        LOG.info("Sync: START DeviceSyncer sync.");
        let deviceSyncer = new DeviceSyncer(actions, [], globalCloudIdMap);
        return deviceSyncer.sync(state);
      })
      .then(() => {
        LOG.info("Sync: DONE DeviceSyncer sync.");
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
        let reloadTrackingRequired = false;

        actions.forEach((action) => {
          action.triggeredBySync = true;

          switch (action.type) {
            case 'ADD_SPHERE':
            case 'REMOVE_SPHERE':
            case 'ADD_LOCATION':
            case 'REMOVE_LOCATION':
              reloadTrackingRequired = true; break;
          }
        });

        if (actions.length > 0) {
          store.batchDispatch(actions);
        }

        LOG.info("Sync: Requesting notification permissions during updating of the device.");
        NotificationHandler.request();

        eventBus.emit("CloudSyncComplete");

        if (reloadTrackingRequired) {
          eventBus.emit("CloudSyncComplete_spheresChanged");
        }

        LOG.info("Sync after: START MessageCenter checkForMessages.");
        MessageCenter.checkForMessages();
        LOG.info("Sync after: DONE MessageCenter checkForMessages.");

      })
      .then(() => {
        this.__currentlySyncing = false;
      })
      .catch((err) => {
        LOG.info("SYNC: Failed... Could dispatch ", actions.length, " actions!", actions);
        actions.forEach((action) => {
          action.triggeredBySync = true;
        });

        // if (actions.length > 0) {
        //   store.batchDispatch(actions);
        // }

        this.__currentlySyncing = false;
        LOG.error("SYNC: error during sync:", err);
        throw err;
      })
  }
};

let getUserIdCheckError = (state, store, retryThisAfterRecovery) => {
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

