import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import { eventBus }              from './EventBus';
import {LOG, LOGe} from "../logging/Log";
import { Actions } from "react-native-router-flux";
import {NativeBus} from "../native/libInterface/NativeBus";
import {CLOUD} from "../cloud/cloudAPI";
import {Util} from "./Util";
import { Sentry } from "react-native-sentry";
import {Scheduler} from "../logic/Scheduler";

export const AppUtil = {
  quit: function() {
    Bluenet.quitApp();
  },

  resetBle: function() {
    if (Platform.OS === 'android') {
      Bluenet.resetBle();
    }
  },

  resetDatabase(store, eventBus) {
    eventBus.emit("showLoading", "Preparing for download...")
    let clearDB = () => {
      NativeBus.clearAllEvents();
      Scheduler.reset();

      eventBus.emit("showLoading", "Clearing database...");

      let state = store.getState();
      let sphereIds = Object.keys(state.spheres);
      let actions = [];

      sphereIds.forEach((sphereId) => {
        actions.push({__purelyLocal: true, __noEvents: true, type:"REMOVE_SPHERE", sphereId: sphereId});
      })

      actions.push({__purelyLocal: true, __noEvents: true, type:'RESET_APP_SETTINGS'})

      store.batchDispatch(actions);
      eventBus.emit("showLoading", "Getting new data...")
      CLOUD.__syncTriggerDatabaseEvents = false;
      CLOUD.sync(store)
        .then(() => {
          eventBus.emit("showLoading", "Finalizing...");
          return new Promise((resolve, reject) => {
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 5 seconds.\n\nReopen the app to finalize the process."); }, 1000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 4 seconds.\n\nReopen the app to finalize the process."); }, 2000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 3 seconds.\n\nReopen the app to finalize the process."); }, 3000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 2 seconds.\n\nReopen the app to finalize the process."); }, 4000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 1 second. \n\nReopen the app to finalize the process."); }, 5000);
            setTimeout(() => { Bluenet.quitApp(); resolve(true); }, 6000)
          })
        })
        .catch((err) => {
          eventBus.emit("showLoading", "Falling back to full clean...");
          return StoreManager.destroyActiveUser()
        })
        .then((success) => {
          if (!success) {
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 5 seconds.\n\nLog in again to finalize the process."); }, 1000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 4 seconds.\n\nLog in again to finalize the process."); }, 2000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 3 seconds.\n\nLog in again to finalize the process."); }, 3000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 2 seconds.\n\nLog in again to finalize the process."); }, 4000);
            setTimeout(() => { eventBus.emit("showLoading", "App will close in 1 second. \n\nLog in again to finalize the process."); }, 5000);
            setTimeout(() => { Bluenet.quitApp(); }, 6000)
          }
        })
        .catch((err) => {
          Alert.alert("Data reset failed...", "Something went wrong in the data reset process. The best way to solve this is to remove the app from your phone, reinstall it and log into you account",[{text:"OK"}])
        })
    }

    if (CLOUD.__currentlySyncing) {
      let unsub = eventBus.on('CloudSyncComplete', () => {
        setTimeout(() => { unsub(); clearDB(); }, 200);
      })
    }
    else {
      clearDB();
    }
  },


  logOut: function(store, message = null) {
    if (message) {
      Alert.alert(message.title, message.body, [{text:'OK', onPress:() => {
        AppUtil._logOut(store, () => {Bluenet.quitApp();});
      }}], { cancelable: false });
    }
    else {
      let gracefulExit = () => {
        LOG.info("Quit app due to logout");
        setTimeout(() => {
          Bluenet.quitApp();
        }, 3500);
      };

      AppUtil._logOut(store, gracefulExit);
    }
  },

  _logOut: function(store, gracefulExit) {

    Sentry.captureBreadcrumb({
      category: 'logout',
      data: {
        state:'startLogOut'
      }
    });

    eventBus.emit("showLoading", {text:"Logging out and closing app...", opacity:0.25});

    // clear position for this device.
    let state = store.getState();
    let deviceId = Util.data.getCurrentDeviceId(state);
    Actions.logout();

    // clear all events listeners, should fix a lot of redraw issues which will crash at logout
    eventBus.clearAllEvents();
    NativeBus.clearAllEvents();

    // sign out of all spheres.
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    });

    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    CLOUD.forDevice(deviceId).updateDeviceSphere(null)  // will also clear location
      .catch(() => {})
      .then(() => {
        return StoreManager.userLogOut()
      })
      .then(() => {
        LOG.info("Quit app due to logout.");
        gracefulExit();
      })
      .catch((err) => {
        LOGe.info("Could not log user out!", err);
        gracefulExit();
      });
  },
};