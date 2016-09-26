import { Alert } from 'react-native'

import { LOG }              from './logging/Log'
import { CLOUD }            from './cloud/cloudAPI'
import { LocalizationUtil } from './native/LocalizationUtil'
import { Scheduler } from './logic/Scheduler'


/**
 * this will handle pretty much anything that needs to be run on startup.
 *
 */
export const INITIALIZER = {
  started: false,
  start: function(store, eventBus) {
    if (this.started === false) {


      // subscribe to iBeacons when required.
      CLOUD.events.on('CloudSyncComplete_spheresChanged', () => {LocalizationUtil.trackSpheres(store);});
      eventBus.on(    'appStarted',                       () => {LocalizationUtil.trackSpheres(store);});
      eventBus.on(    'sphereCreated',                    () => {LocalizationUtil.trackSpheres(store);});

      // sync every 5 minutes
      Scheduler.setRepeatingTrigger('backgroundSync', {repeatEveryNSeconds:60*5});
      Scheduler.loadCallback('backgroundSync', () => {
        let state = store.getState();
        if (state.user.userId) {
          LOG("STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(store, true);
        }
      });

      // configure the CLOUD network handler.
      let handler = function(error) {
        Alert.alert(
          "Connection Problem",
          "Could not connect to the Cloud. Please check your internet connection.",
          [{text: 'OK', onPress: () => {eventBus.emit('hideLoading');}}]
        );
      };

      CLOUD.setNetworkErrorHandler(handler);
      this.started = true;
    }
  }
};