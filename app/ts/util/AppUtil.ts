import { Languages } from "../Languages";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AppUtil", key)(a, b, c, d, e);
}

import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import {LOG, LOGe} from "../logging/Log";
import {CLOUD} from "../cloud/cloudAPI";
import {Util} from "./Util";
// import * as Sentry from "@sentry/react-native";
import {Scheduler} from "../logic/Scheduler";
import { core } from "../core";
import { NavigationUtil } from "./NavigationUtil";
import { Stacks } from "../router/Stacks";

export const AppUtil = {
  quit: function() {
    Bluenet.quitApp();
  },

  resetBle: function() {
    if (Platform.OS === 'android') {
      Bluenet.resetBle();
    }
  },

  resetDatabase() {
    core.eventBus.emit("showLoading", lang("Preparing_for_download___"));
    let clearDB = () => {
      core.eventBus.clearMostEvents();
      core.nativeBus.clearAllEvents();
      Scheduler.reset();

      core.eventBus.emit("showLoading", lang("Clearing_database___"));

      let state = core.store.getState();
      let sphereIds = Object.keys(state.spheres);
      let actions = [];

      sphereIds.forEach((sphereId) => {
        actions.push({__purelyLocal: true, __noEvents: true, type:"REMOVE_SPHERE", sphereId: sphereId});
      });

      actions.push({__purelyLocal: true, __noEvents: true, type:'RESET_APP_SETTINGS'});

      core.store.batchDispatch(actions);
      core.eventBus.emit("showLoading", lang("Getting_new_data___"));
      StoreManager.destroyActiveUser()
        .then(() => {
          CLOUD.__syncTriggerDatabaseEvents = false;
          return CLOUD.sync(false, false)
        })
        .then(() => {
          StoreManager.persistor.persistFull();
          core.eventBus.emit("showLoading", lang("Finalizing___"));
          return new Promise((resolve, reject) => {
            setTimeout(() => { core.eventBus.emit("showLoading", lang("App_will_close_in___secon",5)); }, 1000);
            setTimeout(() => { core.eventBus.emit("showLoading", lang("App_will_close_in___secon",4)); }, 2000);
            setTimeout(() => { core.eventBus.emit("showLoading", lang("App_will_close_in___secon",3)); }, 3000);
            setTimeout(() => { core.eventBus.emit("showLoading", lang("App_will_close_in___secon",2)); }, 4000);
            setTimeout(() => { core.eventBus.emit("showLoading", lang("App_will_close_in___secon",1)); }, 5000);
            setTimeout(() => { Bluenet.quitApp(); resolve(true); }, 6000)
          })
        })
        .catch((err) => {
          LOGe.info("Failed to reset database", err);
          Alert.alert(lang("Data_reset_failed___"), lang("Something_went_wrong_in_t"),[{text: lang("OK"), onPress: () => { AppUtil.quit(); }}], { cancelable: false})
        })
    };

    if (CLOUD.__currentlySyncing) {
      let unsub = core.eventBus.on('CloudSyncComplete', () => {
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

    // Sentry.addBreadcrumb({
    //   category: 'logout',
    //   data: {
    //     state:'startLogOut'
    //   }
    // });
    // TODO: Wait for possibly pending sync to stop
    core.eventBus.emit("showLoading", {text:lang("Logging_out_and_closing_a"), opacity:0.25});

    // clear position for this device.
    let state = store.getState();
    let deviceId = Util.data.getCurrentDeviceId(state);
    NavigationUtil.setRoot(Stacks.logout());

    // clear all events listeners, should fix a lot of redraw issues which will crash at logout
    core.eventBus.clearAllEvents();
    core.nativeBus.clearAllEvents();

    // sign out of all spheres.
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    });

    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    CLOUD.forDevice(deviceId).exitSphere("*")  // will also clear location
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