import { Alert, AppState }       from 'react-native';

import { Bluenet }               from "../native/libInterface/Bluenet";
import { BluenetPromiseWrapper } from "../native/libInterface/BluenetPromise";
import { LocationHandler }       from "../native/localization/LocationHandler";
import { CLOUD }                 from "../cloud/cloudAPI";
import { AppUtil }               from "../util/AppUtil";
import { Util }                  from "../util/Util";

import { DataUtil, prepareStoreForUser } from "../util/DataUtil";

import { StoreManager }          from "../router/store/storeManager";
import { FirmwareWatcher }       from "./FirmwareWatcher";
import { Scheduler }             from "../logic/Scheduler";
import { SetupStateHandler }     from "../native/setup/SetupStateHandler";
import { LOG_EXTENDED_TO_FILE, LOG_TO_FILE, CLOUD_POLLING_INTERVAL, SYNC_INTERVAL } from "../ExternalConfig";
import { BatterySavingUtil }     from "../util/BatterySavingUtil";
import { MapProvider }           from "./MapProvider";
import { DfuStateHandler }       from "../native/firmware/DfuStateHandler";
import { NotificationHandler }   from "./NotificationHandler";
import { MessageCenter }         from "./MessageCenter";
import { CloudEventHandler }     from "./CloudEventHandler";
import { Permissions }           from "./PermissionManager";
import { LOG, LOGe, LOGw }       from "../logging/Log";
import { LogProcessor }          from "../logging/LogProcessor";
import { BleLogger }             from "../native/advertisements/BleLogger";
import { StoneManager }          from "../native/advertisements/StoneManager";
import { MeshUtil }              from "../util/MeshUtil";
import { Sentry }                from "react-native-sentry";
import { ToonIntegration }       from "./thirdParty/ToonIntegration";
import { EncryptionManager }     from "../native/libInterface/Encryption";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { WatchStateManager } from "./WatchStateManager";

const PushNotification = require('react-native-push-notification');
import { core } from "../core";
import { cleanLogs } from "../logging/LogUtil";
import { migrate } from "./migration/StoreMigration";
import { CloudPoller } from "../logic/CloudPoller";
import { UpdateCenter } from "./UpdateCenter";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { StoneDataSyncer } from "./StoneDataSyncer";
import { BackButtonHandler } from "./BackButtonHandler";
import { base_core } from "../base_core";
import { PowerUsageCacher } from "./PowerUsageCacher";
import { TimeKeeper } from "./TimeKeeper";
import { SphereStateManager } from "./SphereStateManager";
import { UptimeMonitor } from "./UptimeMonitor";

const BACKGROUND_SYNC_TRIGGER = 'backgroundSync';
const BACKGROUND_USER_SYNC_TRIGGER = 'activeSphereUserSync';

class BackgroundProcessHandlerClass {
  started : boolean = false;
  userLoggedIn : boolean = false;
  storePrepared : boolean = false;
  connectionPopupActive : boolean = false;

  cancelPauseTrackingCallback = null;
  trackingPaused = false;

  constructor() { }

  start() {
    if (!this.started) {
      LOG.info("BackgroundProcessHandler: Starting the background processes.");
      // start the BLE things.
      // route the events to React Native
      Bluenet.rerouteEvents();

      BluenetPromiseWrapper.isDevelopmentEnvironment().then((result) => {
        base_core.sessionMemory.developmentEnvironment = result;
      });

      // hook into the back button handler for android.
      BackButtonHandler.init();

      // if there is a badge number, remove it on opening the app.
      this._clearBadge();

      // we first setup the event listeners since these events can be fired by the this.startStore().

      // when the user is logged in we track spheres and scan for Crownstones
      // This event is triggered on boot by the start store or by the login process.
      core.eventBus.on('userLoggedIn', () => {
        // clear the temporary data like state and disability of stones so no old data will be shown
        prepareStoreForUser();

        let state = core.store.getState();
        if (state.app.indoorLocalizationEnabled === false) {
          LOG.info("BackgroundProcessHandler: Set background processes to OFF");
          Bluenet.setBackgroundScanning(false);
        }

        LOG.info("BackgroundProcessHandler: received userLoggedIn event.");

        // disable battery saving (meaning, no BLE scans reach the app)
        Bluenet.batterySaving(false);

        // initialize logging to file if this is required.
        this.setupLogging();
      });

      // when the user is logged in we track spheres and scan for Crownstones
      // This event is triggered on boot by the start store or by the login process.
      core.eventBus.on('userLoggedInFinished', () => {
        this.userLoggedIn = true;

        // pass the store to the singletons
        LOG.info("BackgroundProcessHandler: Starting singletons.");
        this.startSingletons();

        this.startCloudService();

        this.startEventTriggers();

        this.startBluetoothListener();

        this.updateDeviceDetails();

        LocationHandler.applySphereStateFromStore();

        UpdateCenter.checkForFirmwareUpdates();

        this.setupLogging();

        // init behaviour based on if we are in the foreground or the background.
        this._applyAppStateOnScanning(AppState.currentState);
        this._applyAppStateOnCaching(AppState.currentState);

        BroadcastStateManager.init();

        let state = core.store.getState();
        // this should have been covered by the naming of the AI. This is a fallback and it's for users who are not admins.
        if (state.user.accessToken !== null && state.user.isNew !== false) {
          core.store.dispatch({type:'USER_UPDATE', data: {isNew: false}});
        }

        LOG.info("BackgroundProcessHandler: received userLoggedInFinished event.");
        LocationHandler.initializeTracking();

        LOG.info("Sync: Requesting notification permissions during Login.");
        NotificationHandler.request();

        // this will check if a whats-new overlay needs to be shown. Only happens on first boot of a new version.
        // this.showWhatsNew();
      });

      // wait for store to be prepared in order to continue.
      core.eventBus.on("storePrepared", () => {
        LOG.info("BackgroundProcessHandler: Store is prepared.");
        this.storePrepared = true;
      });

      // Create the store from local storage. If there is no local store yet (first open), this is synchronous
      this.startStore();

    }
    this.started = true;
  }

  setupLogging() {
    let state = core.store.getState();
    Bluenet.enableLoggingToFile((state.user.developer === true && state.development.logging_enabled === true) || LOG_TO_FILE === true);
    if ((state.user.developer === true && state.development.logging_enabled === true && state.development.nativeExtendedLogging === true) || LOG_EXTENDED_TO_FILE === true) {
      Bluenet.enableExtendedLogging(true);
    }


    // use periodic events to clean the logs.
    let triggerId = "LOG_CLEANING_TRIGGER";
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds: 5*3600});
    Scheduler.loadCallback(triggerId,() => { cleanLogs() }, true);

  }


  /**
   * Triggers background sync, sets the networkError handler which is used when there is no internet connection
   */
  startCloudService() {
    // sync every 10 minutes
    Scheduler.setRepeatingTrigger(BACKGROUND_SYNC_TRIGGER,      {repeatEveryNSeconds: SYNC_INTERVAL});
    Scheduler.setRepeatingTrigger(BACKGROUND_USER_SYNC_TRIGGER, {repeatEveryNSeconds: CLOUD_POLLING_INTERVAL});

    // if the app is open, update the user locations every 10 seconds
    Scheduler.loadCallback(BACKGROUND_USER_SYNC_TRIGGER, () => {
      if (SetupStateHandler.isSetupInProgress() === false) {
        CloudPoller.poll()
      }
    });

    // sync the full db with the cloud every 10 minutes
    Scheduler.loadCallback(BACKGROUND_SYNC_TRIGGER, () => {
      let state = core.store.getState();
      // if a crownstone is in setup mode, we do not sync at that time
      if (SetupStateHandler.isSetupInProgress() === false) {
        if (state.user.userId) {
          LOG.info("BackgroundProcessHandler: STARTING ROUTINE SYNCING IN BACKGROUND");
          CLOUD.sync(core.store, true)
            .then(() => { UpdateCenter.checkForFirmwareUpdates(); })
            .catch((err) => { LOGe.cloud("Error during background sync: ", err)});
        }
      }
      else {
        LOG.info("BackgroundProcessHandler: Skipping routine sync due to active setup phase.");
      }
    });

    // set the global network error handler.
    CLOUD.setNetworkErrorHandler((err) => {
      if (this.connectionPopupActive === false) {
        this.connectionPopupActive = true;
        this.connectionPopupActive = false; core.eventBus.emit('hideLoading');
        LOGw.cloud("Could not connect to the cloud.", err);
        Alert.alert(
          "Connection Problem",
          "Could not connect to the Cloud. Please check your internet connection.",
          [{text: 'OK'}],
        );
      }
    });
  }



  /**
   * Update device specs: Since name is user editable, it can change over time. We use this to update the model.
   */
  updateDeviceDetails() {
    let state = core.store.getState();
    let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
    let deviceInDatabaseId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
    if (currentDeviceSpecs.address && deviceInDatabaseId) {
      let deviceInDatabase = state.devices[deviceInDatabaseId];
      // if the address matches but the name does not, update the device name in the cloud.
      if (deviceInDatabase.address === currentDeviceSpecs.address && 
        (currentDeviceSpecs.name != deviceInDatabase.name) || 
        (currentDeviceSpecs.os != deviceInDatabase.os) || 
        (currentDeviceSpecs.userAgent != deviceInDatabase.userAgent) || 
        (currentDeviceSpecs.deviceType != deviceInDatabase.deviceType) || 
        (currentDeviceSpecs.model != deviceInDatabase.model) || 
        (currentDeviceSpecs.locale != deviceInDatabase.locale) || 
        (currentDeviceSpecs.description != deviceInDatabase.description))
        {
        core.store.dispatch({type: 'UPDATE_DEVICE_CONFIG', deviceId: deviceInDatabaseId, data: {
          name: currentDeviceSpecs.name,
          os: currentDeviceSpecs.os,
          userAgent: currentDeviceSpecs.userAgent,
          deviceType: currentDeviceSpecs.deviceType,
          model: currentDeviceSpecs.model,
          locale: currentDeviceSpecs.locale,
          description: currentDeviceSpecs.description
        }})
      }
    }
  }

  /**
   * - When the user is logged in, we start listening for BLE and tracking spheres.
   *
   */
  startEventTriggers() {
    // listen to the state of the app: if it is in the foreground or background
    AppState.addEventListener('change', (appState) => {
      LOG.info("App State Change", appState);
      Sentry.captureBreadcrumb({
        category: 'AppState',
        data: {
          state: appState,
        }
      });

      this._applyAppStateOnScanning(appState);
      this._applyAppStateOnCaching(appState);
    });
  }


  _applyAppStateOnCaching(appState) {
    if (appState === "active" && this.userLoggedIn) {
      PowerUsageCacher.start();
    }
    else if (appState === 'background') {
      PowerUsageCacher.stop();
    }
  }


  _applyAppStateOnScanning(appState) {
    // in the foreground: start scanning!
    if (appState === "active" && this.userLoggedIn) {
      BatterySavingUtil.startNormalUsage();

      // clear all mesh network ids in all spheres on opening the app.
      MeshUtil.clearMeshNetworkIds(core.store);

      // remove any badges from the app icon on the phone.
      this._clearBadge();

      // restore tracking state if required. An independent check for the indoorlocalization state is not required.
      if (this.cancelPauseTrackingCallback !== null) {
        this.cancelPauseTrackingCallback();
        this.cancelPauseTrackingCallback = null;
      }
      if (this.trackingPaused) {
        Bluenet.resumeTracking();
        BluenetPromiseWrapper.isReady().then(() => {
          LOG.info("BackgroundProcessHandler: Start Scanning after inactive.");
          return Bluenet.startScanningForCrownstonesUniqueOnly();
        });
        this.trackingPaused = false;
      }

      // if the app is open, update the user locations every 10 seconds
      Scheduler.resumeTrigger(BACKGROUND_USER_SYNC_TRIGGER);
    }
    else if (appState === 'background') {
      // in the background: stop scanning to save battery!
      BatterySavingUtil.startBatterySaving();

      // check if we require indoor localization, pause tracking if we dont.
      let state = core.store.getState();
      if (state.app.indoorLocalizationEnabled === false) {
        this.cancelPauseTrackingCallback = Scheduler.scheduleCallback(() => {
          // stop all scanning and tracking to save battery. This will only happen if the app lives in the background for 5 minutes when it shouldnt.
          Bluenet.pauseTracking();
          Bluenet.stopScanning();
          this.cancelPauseTrackingCallback = null;
          this.trackingPaused = true;
        }, 5*60*1000, 'pauseTracking');
      }

      // remove the user sync so it won't use battery in the background
      Scheduler.pauseTrigger(BACKGROUND_USER_SYNC_TRIGGER);
    }
  }

  _clearBadge() {
    // if there is a badge number, remove it on opening the app.
    PushNotification.setApplicationIconBadgeNumber(0);
  }

  startBluetoothListener() {
    // Ensure we start scanning when the bluetooth module is powered on.
    core.nativeBus.on(core.nativeBus.topics.bleStatus, (status) => {
      if (this.userLoggedIn && status === 'poweredOn') {
        BatterySavingUtil.startNormalUsage();
      }
    });

    Bluenet.requestBleState();
  }

  startStore() {
    // there can be a race condition where the event has already been fired before this module has initialized
    // This check is to ensure that it doesn't matter what comes first.
    if (StoreManager.isInitialized() === true) {
      this._verifyStore();
    }
    else {
      core.eventBus.on('storeManagerInitialized', () => { this._verifyStore(); });
    }
  }

  _verifyStore() {
    core.store = StoreManager.getStore();
    base_core.store = StoreManager.getStore();
    let state = core.store.getState();

    // if we have an accessToken, we proceed with logging in automatically
    if (state.user.accessToken !== null) {
      // in the background we check if we're authenticated, if not we log out.
      CLOUD.setAccess(state.user.accessToken);
      CLOUD.forUser(state.user.userId).getUserData()
        .catch((err) => {
          if (err.status === 401) {
            LOGw.info("BackgroundProcessHandler: Could not verify user, attempting to login again.");
            return CLOUD.login({
              email: state.user.email,
              password: state.user.passwordHash,
              background: true
            })
            .then((response) => {
              CLOUD.setAccess(response.id);
              CLOUD.setUserId(response.userId);
              core.store.dispatch({type:'USER_APPEND', data:{accessToken: response.id}});
            })
          }
          else {
            throw err;
          }
        })
        .then((reply) => {
          LOG.info("BackgroundProcessHandler: Verified User.", reply);
          CLOUD.sync(core.store, true).catch(() => {})
        })
        .catch((err) => {
          LOG.info("BackgroundProcessHandler: COULD NOT VERIFY USER -- ERROR", err);
          if (err.status === 401) {
            AppUtil.logOut(core.store, {title: "Access token expired.", body:"I could not renew this automatically. The app will clean up and exit now. Please log in again."});
          }
        });
      this.userLoggedIn = true;

      migrate();

      let healthyDatabase = DataUtil.verifyDatabase(true);
      if (!healthyDatabase) {
        Alert.alert("Something went wrong...","I have identified a problem with the Sphere on your phone... I'll have to redownload it from the Cloud to fix this.", [{text:'OK', onPress: () => {
            AppUtil.resetDatabase(core.store, core.eventBus);
          }}], {cancelable:false});
        return;
      }

      DataUtil.verifyPicturesInDatabase(state);

      core.eventBus.emit("userLoggedIn");
      core.eventBus.emit("storePrepared");
      if (state.user.isNew === false) {
        core.eventBus.emit("userLoggedInFinished");
      }
    }
    else {
      core.eventBus.emit("storePrepared");
    }
  }


  startSingletons() {
    BleLogger.init();
    CloudEventHandler.init();
    DfuStateHandler.init();
    EncryptionManager.init();
    FirmwareWatcher.init();
    LogProcessor.init();
    LocationHandler.init();
    MapProvider.init();
    MessageCenter.init();
    NotificationHandler.init();
    Permissions.init();
    PowerUsageCacher.init();
    Scheduler.init();
    StoneAvailabilityTracker.init();
    StoneDataSyncer.init();
    StoneManager.init();
    StoneDataSyncer.init();
    SetupStateHandler.init();
    SphereStateManager.init();
    TimeKeeper.init();
    ToonIntegration.init();
    UpdateCenter.init();
    UptimeMonitor.init();
    WatchStateManager.init();
  }
}



export const BackgroundProcessHandler = new BackgroundProcessHandlerClass();
