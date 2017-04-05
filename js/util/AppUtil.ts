import { Alert, Platform }       from 'react-native';
import { Scheduler }             from '../logic/Scheduler'
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/Proxy'
import { Bluenet  }              from '../native/Bluenet';
import { eventBus  }              from '../util/EventBus';
import { Actions }               from 'react-native-router-flux';
import {LOG} from "../logging/Log";

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

  logOut: function() {
    let gracefulExit = () => {
      LOG.info("Quit app due to logout");
      eventBus.emit("showLoading", "Logging out and closing app...");
      setTimeout(() => {
        Bluenet.quitApp();
      }, 1500);
    };

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

  },
};