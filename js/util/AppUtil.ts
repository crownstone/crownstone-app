import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import { eventBus }              from './EventBus';
import { LOG }                   from "../logging/Log";
import { prepareStoreForUser }   from "./DataUtil";
import {Actions} from "react-native-router-flux";

export const AppUtil = {
  quit: function() {
    if (Platform.OS === 'android') {
      Bluenet.quitApp();
    }
  },

  resetBle: function() {
    if (Platform.OS === 'android') {
      Bluenet.resetBle();
    }
  },

  logOut: function(store) {
    eventBus.emit("showLoading", "Logging out and closing app...");

    Actions.loginSplash();

    // clear all events listeners, should fix a lot of redraw issues which will crash at logout
    eventBus.clearAllEvents();

    // sign out of all spheres.
    let state = store.getState();
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    });

    let gracefulExit = () => {
      LOG.info("Quit app due to logout");
      setTimeout(() => {
        Bluenet.quitApp();
      }, 3500);
    };

    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    StoreManager.userLogOut()
      .then(() => {
        LOG.info("Quit app due to logout.");
        gracefulExit();
      })
      .catch((err) => {
        LOG.error("Could not log user out!", err);
        gracefulExit();
      });

  },
};