import { Alert, AppState, Platform, StatusBar } from 'react-native'

import { LOG, LOGError }              from './logging/Log'
import { CLOUD }            from './cloud/cloudAPI'
import { LocalizationUtil } from './native/LocalizationUtil'
import { Scheduler } from './logic/Scheduler'
import { BleActions, Bluenet, NativeBus } from './native/Proxy';
import { eventBus }         from './util/eventBus'


/**
 * this will handle pretty much anything that needs to be run on startup.
 *
 */
export const INITIALIZER = {
  /**
   * Init happens before start, it triggers
   */
  initialized: false,
  init: function() {
    if (this.initialized === false) {
      LOG("Events forwarded");

      // route the events to React Native
      Bluenet.rerouteEvents();

      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('#00162C', true);
      }

      // listen to the BLE events
      NativeBus.on(NativeBus.topics.bleStatus, (status) => {
        switch (status) {
          case "poweredOff":

            break;
          case "poweredOn":
            BleActions.isReady().then(() => {
              Bluenet.startScanningForCrownstonesUniqueOnly();
            });
            break;
          case "unauthorized":

            break;
          default:

            break;
        }
      });

      this.initialized = true;
    }
  },

  /**
   * Start the app after init
   */
  started: false,
  start: function(store) {
    if (this.started === false) {
      // subscribe to iBeacons when required.
      CLOUD.events.on('CloudSyncComplete_spheresChanged', () => {LocalizationUtil.trackSpheres(store);});
      eventBus.on(    'appStarted',                       () => {
        BleActions.isReady().then(() => {Bluenet.startScanningForCrownstonesUniqueOnly()});
        LocalizationUtil.trackSpheres(store);
      });
      eventBus.on(    'sphereCreated',                    () => {LocalizationUtil.trackSpheres(store);});

      // sync every 5 minutes
      Scheduler.setRepeatingTrigger('backgroundSync', {repeatEveryNSeconds:60*5});
      Scheduler.loadCallback('backgroundSync', () => {
        let state = store.getState();
        if (state.user.userId) {
          LOG("STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(store, true).catch((err) => { LOGError("Error during background sync: ", err)});
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

      // listen to the state of the app, if it is in the foreground or background
      AppState.addEventListener('change', (appState) => {
        if (appState === "active") {

        }
      });
      this.started = true;
    }
  }
};