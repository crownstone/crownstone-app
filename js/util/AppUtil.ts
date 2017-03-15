import { Alert, Platform }       from 'react-native';
import { Scheduler }             from '../logic/Scheduler'
import { StoreManager }          from '../router/store/storeManager'
import { BluenetPromiseWrapper } from '../native/Proxy'
import { Bluenet  }              from '../native/Bluenet';
import { Actions }               from 'react-native-router-flux';

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
    BluenetPromiseWrapper.clearTrackedBeacons().catch(() => {});
    Bluenet.stopScanning();
    Scheduler.reset();
    (Actions as any).loginSplash();
    StoreManager.userLogOut().catch(() => {});
  },
};