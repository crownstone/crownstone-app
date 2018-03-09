import { Alert, Platform }       from 'react-native';
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/libInterface/BluenetPromise'
import { Bluenet }               from '../native/libInterface/Bluenet';
import { eventBus }              from './EventBus';
import { LOG }                   from "../logging/Log";
import { Actions } from "react-native-router-flux";
import {NativeBus} from "../native/libInterface/NativeBus";
import {CLOUD} from "../cloud/cloudAPI";
import {Util} from "./Util";

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
    CLOUD.forDevice(deviceId).updateDeviceSphere(null)
      .catch(() => {})
      .then(() => {
        return CLOUD.forDevice(deviceId).updateDeviceLocation(null);
      })
      .catch(() => {})
      .then(() => {
        return StoreManager.userLogOut()
      })
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