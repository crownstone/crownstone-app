import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import { eventBus }              from './EventBus';
import { LOG }                   from "../logging/Log";
import { prepareStoreForUser }   from "./DataUtil";

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
    eventBus.emit("showLoading", "Logging out and closing app...");

    // sign out of all spheres.
    let state = store.getState();
    let sphereIds = Object.keys(state.spheres);
    sphereIds.forEach((sphereId) => {
      store.dispatch({type: 'SET_SPHERE_STATE', sphereId: sphereId, data: {reachable: false, present: false}});
    });

    // clear all usage and presence:
    prepareStoreForUser(store);

    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    StoreManager.userLogOut()
      .then(() => {
        LOG.info("Quit app due to logout");
        gracefulExit();
      })
      .catch((err) => {
        LOG.error("Could not log user out!", err);
        gracefulExit();
      });
  }
};