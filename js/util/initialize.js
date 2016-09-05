import { Alert } from 'react-native'

import { CLOUD }            from '../cloud/cloudAPI'
import { LocalizationUtil } from '../native/LocalizationUtil'


/**
 * this will handle pretty much anything that needs to be run on startup.
 *
 */
export const INITIALIZER = {
  started: false,
  start: function(store, eventBus) {
    if (this.started === false) {

      // console.log("STARTING")
      // subscribe to iBeacons when required.
      CLOUD.events.on('CloudSyncComplete_groupsChanged', () => {LocalizationUtil.trackGroups(store);});
      eventBus.on(    'appStarted',                      () => {LocalizationUtil.trackGroups(store);});
      eventBus.on(    'groupCreated',                    () => {LocalizationUtil.trackGroups(store);});

      // configure the CLOUD network handler.
      CLOUD.setNetworkErrorHandler((error) => {
        Alert.alert("Connection Problem", "Could not connect to the Cloud. Please check your internet connection.",[{text:'OK'}]);
      });
      this.started = true;
    }
  }
};