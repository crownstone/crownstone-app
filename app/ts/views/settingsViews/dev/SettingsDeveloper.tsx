import * as React from 'react';
import {
  Alert, Platform,
  ScrollView, Text, TouchableWithoutFeedback, View
} from "react-native";

import { IconButton } from '../../components/IconButton'
import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import { background, colors, screenWidth } from "../../styles";
import { LiveComponent } from "../../LiveComponent";
import { core } from "../../../Core";
import { clearLogs, getLoggingFilename, LOG_PREFIX } from "../../../logging/LogUtil";
import { Bluenet } from "../../../native/libInterface/Bluenet";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { CLOUD } from "../../../cloud/cloudAPI";
import { Scheduler } from "../../../logic/Scheduler";
import { Util } from "../../../util/Util";
import { MeshUtil } from "../../../util/MeshUtil";
import { CLOUD_ADDRESS } from "../../../ExternalConfig";
import { TopbarImitation } from "../../components/TopbarImitation";
import { topBarStyle } from "../../components/topbar/TopbarStyles";
import { SlideFadeInView } from "../../components/animated/SlideFadeInView";
import { BroadcastStateManager } from "../../../backgroundProcesses/BroadcastStateManager";
import { OnScreenNotifications } from "../../../notifications/OnScreenNotifications";
import { LocationHandler } from "../../../native/localization/LocationHandler";
import { OverlayManager } from "../../../backgroundProcesses/OverlayManager";
import { ScaledImage } from "../../components/ScaledImage";
import { DevAppState } from "../../../backgroundProcesses/dev/DevAppState";
import { Stacks } from "../../Stacks";
import { FileUtil } from "../../../util/FileUtil";
import Share from "react-native-share";
import { base_core } from "../../../Base_core";
import { LocalizationLogger } from "../../../backgroundProcesses/LocalizationLogger";
import { LOGw } from "../../../logging/Log";

const RNFS = require('react-native-fs');


type emailDataType = "allBuffers" | "switchCraftBuffers" | "measurementBuffers" | "logs"
interface iEmailData { [key: string]: emailDataType }

const EMAIL_DATA_TYPE = {
  allBuffers:           'All buffers',
  switchCraftBuffers:   'SwitchCraft buffers',
  measurementBuffers:   'Measurement buffers',
  errorBuffers:         'Error buffers',
  logs:                 'Logs',
  localization:         'Localization datasets',
}


export class SettingsDeveloper extends LiveComponent<any, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };

  unsubscribe : any = [];
  count = 0;
  lastCountTime = 0;

  constructor(props) {
    super(props);

    let state = core.store.getState();

    this.state = { devAppVisible: state.development.devAppVisible && this.props.fromOverview !== true, showSharingSettings: false, sharingDataType: 'logs' }
  }

  componentDidMount() {
    // this is done on boot if the user was already a developer. This can be repeated without sideeffects.
    LocalizationLogger.init();

    this.unsubscribe.push(core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeviceData || change.changeDeveloperData || change.changeUserData || change.changeUserDeveloperStatus || change.changeAppSettings) {
        this.forceUpdate();
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsub) => { unsub() });
  }

  _countSecret() {
    let now = Date.now();
    if (now - this.lastCountTime > 1000) {
      this.count = 1
    }
    else {
      this.count++;
      if (this.count >= 8 && this.state.devAppVisible === false) {
        this.setState({devAppVisible: true})
        core.store.dispatch({type:'CHANGE_DEV_SETTINGS', data: { devAppVisible: true}});
      }
    }

    this.lastCountTime = now;
  }


  _getItems() {
    const store = core.store;
    let state = store.getState();
    let user = state.user;
    let dev = state.development;

    let items = [];
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };


    items.push({label: "LOGGING", type: 'explanation', below: false});
    if (!dev.logging_enabled) {
      items.push({
        label: "Enable Logging",
        value: dev.logging_enabled,
        type: 'switch',
        icon: <IconButton name="ios-create" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
        callback: (newValue) => {
          if (newValue === false) {
            clearAllLogs();
          }
          store.dispatch({
            type: 'SET_LOGGING',
            data: {logging_enabled: newValue}
          });
          Bluenet.enableLoggingToFile(newValue);
        }
      });
    }
    else {
      items.push({
        label: "Logging Configuration",
        type: 'navigation',
        icon: <IconButton name="ios-create" size={22} color="#fff"
                          buttonStyle={{ backgroundColor: colors.green2.hex }}/>,
        callback: () => {
          NavigationUtil.navigate("SettingsLogging");
        }
      });
    }

    items.push({
      label: "Share debug data",
      type: 'button',
      style: { color: colors.purple.hex },
      icon: <IconButton name="ios-mail" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.purple.hex }}/>,
      callback: () => {
        core.eventBus.emit("showPopup", {buttons: [
          {text: EMAIL_DATA_TYPE.logs              , callback: () => { shareData(EMAIL_DATA_TYPE.logs              ) }},
          {text: EMAIL_DATA_TYPE.localization      , callback: () => { shareData(EMAIL_DATA_TYPE.localization      ) }},
          {text: EMAIL_DATA_TYPE.allBuffers        , callback: () => { shareData(EMAIL_DATA_TYPE.allBuffers        ) }},
          {text: EMAIL_DATA_TYPE.switchCraftBuffers, callback: () => { shareData(EMAIL_DATA_TYPE.switchCraftBuffers) }},
          {text: EMAIL_DATA_TYPE.measurementBuffers, callback: () => { shareData(EMAIL_DATA_TYPE.measurementBuffers) }},
          {text: EMAIL_DATA_TYPE.errorBuffers      , callback: () => { shareData(EMAIL_DATA_TYPE.errorBuffers      ) }},
        ]});
      }
    })


    items.push({
      label: "Delete debug data",
      type: 'button',
      style: { color: colors.csBlueDarker.hex },
      icon: <IconButton name="ios-trash" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.csBlueDarker.hex }}/>,
      callback: () => {
        core.eventBus.emit("showPopup", {buttons: [
            {text:"Delete logs", callback: () => {
                Alert.alert(
                  "Clear all Logs?",
                  "Press OK to clear logs.",
                  [{ text: "Cancel", style: 'cancel' }, {
                    text: "OK", onPress: () => {
                      clearAllLogs();
                    }
                  }])
            }},
            {text:"Delete power curve datasets", callback: () => { Alert.alert("Sure about that?","This will delete all collected power curves.",[{text:'no'},{text:"yes", onPress: async () => {
              let storagePath = FileUtil.getPath();
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-false-positive.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-true-positive.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-false-negative.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-true-negative.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-filteredData.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-unfilteredData.log')
              await FileUtil.safeDeleteFile(storagePath + '/power-samples-softFuseData.log')
              Alert.alert("Done!");
            }}]) }},
            {text:"Delete localization datasets",  callback: () => {
            Alert.alert("Sure about that?","This will delete all collected Localization datasets.",[{text:'no'},{text:"yes", onPress: async () => {
              await LocalizationLogger.clearDataFiles();
              Alert.alert("Done!");
            }}]) }},
          ]})
      }})

    items.push({label: "Logging will keep a history of what the app is doing for the last 3 days.", type: 'explanation', below: true});

    items.push({
      label: "View app uptime",
      type: 'navigation',
      icon: <IconButton name="md-calendar" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsUptime")
      }
    });
    items.push({
      label: "View localization history",
      type: 'navigation',
      icon: <IconButton name="ios-home" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.black.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsLocalizationMonitor")
      }
    });
    items.push({label: "View when the app was running.", type: 'explanation', below: true});


    items.push({label: "CLOUD", type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: "Sync Now!",
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="md-cloud-download" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback: () => {
        if (CLOUD.__currentlySyncing === false) {
          core.eventBus.emit("showLoading", "Syncing...");
          CLOUD.sync(store, true)
            .then(() => { core.eventBus.emit("showLoading","Done!"); setTimeout(() => { core.eventBus.emit("hideLoading");}, 500); })
            .catch((err) => { core.eventBus.emit("hideLoading"); Alert.alert(
              "Error during sync.",
              err?.message || JSON.stringify(err),
              [{text:"OK", onPress: () => { core.eventBus.emit("hideLoading"); }}]) })
        }
        else {
          Alert.alert(
"Sync already in progress.",
"There already is an active syncing process running in the background. Syncing can take a long time if there are a lot op power measurements that require syncing.",
[{text:"OK"}]);
        }
    }});
    items.push({
      label: "Test Notifications",
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="ios-jet" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlueLight.hex}} />,
      callback:() => {
        core.eventBus.emit("showLoading", "Requesting Notifications...");

        let clearScheduledTimeout = null;
        let cleanup = null;
        let unsubscribe = core.eventBus.on("NotificationReceived", (data) => {
          if (data.type === "testNotification") {
            Alert.alert(
            "Notification Received!",
            "Everything is working as it should be!",
    [{text:"Great!", onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
            cleanup()
          }
        });

        this.unsubscribe.push(unsubscribe);

        clearScheduledTimeout = Scheduler.scheduleActiveCallback(() => {
          cleanup();
          Alert.alert(
            "Nothing Received...",
            "Maybe try again?",
    [{text:"OK...", onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
        }, 4000);

        cleanup = () => {
          clearScheduledTimeout();
          unsubscribe();
        };

        let deviceId = Util.data.getDeviceIdFromState(state, state.user.appIdentifier);
        if (deviceId) {
          CLOUD.forDevice(deviceId).sendTestNotification().catch((err) => {
            cleanup();
            Alert.alert(
          "Could not send Request!",
       "There was an error. \n" +JSON.stringify(err),
        [{text:"Hmm..", onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
          });
        }
        else {
          Alert.alert(
            "No device Id!",
            "There was an error.",
            [{text:"Hmm..", onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
          cleanup();
        }
      }});
    items.push({
      label: "Cause Crash",
      type: 'button',
      icon: <IconButton name="ios-nuclear" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.darkRed.hex}} />,
      callback:() => {
        core.eventBus.emit("showPopup", {buttons: [
          {text:"Crash JS",   callback: () => { throw new Error("Javascript CRASH Induced") }},
          {text:"Crash JS escalated",   callback: () => {
            try {
              throw new Error("Javascript escalated CRASH Induced")
            }
            catch (err) {
              throw err;
            }}},
          {text:"Crash Bridge",  callback: () => { Bluenet.crash(); }},
        ]})
      }})


    // let deviceId = Util.data.getCurrentDeviceId(state);
    // let device = deviceId && state.devices[deviceId] || null;
    items.push({label: "DEBUG VIEWS", type: 'explanation'});
    items.push({
      label: "BLE Debug",
      type: 'navigation',
      icon: <IconButton name="ios-build" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.lightBlue2.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsBleDebug");
      }});
    items.push({
      label: "Localization Debug",
      type: 'navigation',
      icon: <IconButton name="md-locate" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsLocalizationDebug");
      }})
    items.push({
      label: "Database Explorer",
      type: 'navigation',
      icon: <IconButton name="md-folder" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.iosBlueDark.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsDatabaseExplorer");
      }});

    items.push({label: "MESH", type: 'explanation', below: false});
    items.push({
      label: "Show RSSI in Topology",
      value: dev.show_rssi_values_in_mesh,
      type: 'switch',
      icon: <IconButton name="ios-calculator" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.lightGreen.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_rssi_values_in_mesh: newValue }});
      }});
    items.push({
      label: "Reset networks",
      type:  'button',
      style: {color: colors.black.hex},
      icon:  <IconButton name="ios-nuclear" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback:() => {
        Alert.alert(
"Are you sure?",
"This will reset all mesh networks in the current Sphere.",
[{text:"Do it.", onPress: () => {
              const store = core.store;
              const state = store.getState();
              let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
              MeshUtil.clearMeshNetworkIds(store, sphereId);
              MeshUtil.clearTopology(store, sphereId);
              Alert.alert(
"Reset Done",
"Rediscovery will start automatically.",
[{text:"OK"}]);
            }},{text: "Cancel"}
          ]
        )
      }
    });
    items.push({
      label: "Mesh Topology",
      type: 'navigation',
      icon: <IconButton name="md-share" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlueDark.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsMeshTopology");
      }});

    // if (user.betaAccess) {
    //   items.push({label: "ALPHA FEATURES WILL LOOK LIKE THIS", type: 'explanation', below: false});
    // }
    // else {
    //   items.push({label: "EXPERIMENTAL FEATURES", type: 'explanation', below: false});
    // }
//     items.push({
//       label: "Join Alpha Program",
//       value: user.betaAccess,
//       experimental: user.betaAccess,
//       icon: <IconButton name={"ios-flask"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.blue.hex}}/>,
//       type: 'switch',
//       callback:(newValue) => {
//         let storeIt = () => {
//           store.dispatch({
//             type: 'SET_BETA_ACCESS',
//             data: {betaAccess: newValue}
//           });
//         };
//         if (newValue) {
//           Alert.alert(
// "EXPERIMENTAL!",
// "Switchcraft is currently in the experimental phase. It will not detect all switches, " + "it might switch accidentally or your Built-in Crownstone might be unsupported.\n\n" + "Use this at your own risk! Are you sure?",
// [{text:"I'll wait.", style:'cancel'}, {
// text:"Yes.", onPress: storeIt}]
//           );
//         }
//         else {
//           storeIt();
//         }
//       }});
    // items.push({
    //   label: "Feature Preview",
    //   value: dev.preview,
    //   icon: <IconButton name={"ios-fastforward"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.blueDark.hex}}/>,
    //   type: 'switch',
    //   callback:(newValue) => {
    //     let storeIt = () => {
    //       store.dispatch({
    //         type: 'CHANGE_DEV_SETTINGS',
    //         data: {preview: newValue}
    //       });
    //     };
    //     if (newValue) {
    //       Alert.alert(
    //         "EXPERIMENTAL!",
    //         "Preview will enable new views in parts of the app as a preview into future versions. These might not work at all.\n\nThis is for demonstration purposes, not for home use. Are you sure?",
    //         [{text:"I'll wait.", style:'cancel'}, {
    //           text:"Yes.", onPress: storeIt}]
    //       );
    //     }
    //     else {
    //       storeIt();
    //     }
    //   }});

    items.push({type:'spacer'});
    items.push({
      label: "Show sync button for behaviour",
      value: dev.show_sync_button_in_behaviour,
      icon: <IconButton name={"md-refresh-circle"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex}}/>,
      type: 'switch',
      callback:(newValue) => {
        store.dispatch({
          type: 'CHANGE_DEV_SETTINGS',
          data: {show_sync_button_in_behaviour: newValue}
        });
      }});
    items.push({
      label: "Use time-based nonce",
      value: dev.use_time_based_nonce,
      icon: <IconButton name={"md-clock"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.darkGreen.hex}}/>,
      type: 'switch',
      callback:(newValue) => {
        store.dispatch({
          type: 'CHANGE_DEV_SETTINGS',
          data: {use_time_based_nonce: newValue}
        });
      }});


    items.push({label: "FIRMWARE EARLY ACCESS", type: 'explanation'});
    items.push({
      label: "Beta Firmware Access",
      value: dev.firmwareEarlyAccessLevel >= 50,
      icon: <IconButton name={"ios-cloud-circle"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.csOrange.hex}}/>,
      type: 'switch',
      callback:(newValue) => {
        let level = 0;
        if (newValue) {
          level = 50;
        }
        CLOUD.setEarlyAccess(level);

        store.dispatch({
          type: 'CHANGE_DEV_SETTINGS',
          data: {firmwareEarlyAccessLevel: level}
        });
      }});

    if (state.development.devAppVisible) {
      items.push({
        label: "Alpha Firmware Access",
        value: dev.firmwareEarlyAccessLevel >= 100,
        icon: <IconButton name={"ios-cloud-circle"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.red.hex}}/>,
        type: 'switch',
        callback:(newValue) => {
          let level = 0;
          if (newValue) {
            level = 100;
          }
          CLOUD.setEarlyAccess(level);

          store.dispatch({
            type: 'CHANGE_DEV_SETTINGS',
            data: {firmwareEarlyAccessLevel: level}
          });
        }});
    }
    items.push({label: "WARNING: Early access builds may be broken and can brick your Crownstones. No guarantees are provided on early access builds", type: 'explanation', below: true});


    items.push({label: "RESET DEVELOPER STATE", type: 'explanation'});
    items.push({
      label: "Disable Developer Mode",
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:() => {
        let actions = [];
        actions.push({ type: 'SET_LOGGING', data: {logging: false}});
        actions.push({ type: 'SET_DEVELOPER_MODE', data: {developer: false}});
        actions.push({ type:'CHANGE_DEV_SETTINGS', data: { devAppVisible: false}});

        store.batchDispatch(actions);
        clearAllLogs();
        Bluenet.enableLoggingToFile(false);
        LocalizationLogger.destroy();
        NavigationUtil.back();
    }});

    items.push({label: "CLOUD URL: " + CLOUD_ADDRESS, type: 'explanation'});
    items.push({label: "Debug version loaded :" + base_core.sessionMemory.developmentEnvironment, type: 'explanation'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} hasTopBar={false} hasNavBar={true} hideNotifications={true} hideOrangeLine={true} >
        <TopbarImitation
          left={Platform.OS === 'android' ? null : "Back"}
          title={ "test"}
          titleObject={
            <TouchableWithoutFeedback onPress={() => { this._countSecret() }}>
              <View style={{flex:1, width: screenWidth-160, alignItems:'center', justifyContent:'center'}}>
                <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText]}>{ "Developer Menu" }</Text>
              </View>
            </TouchableWithoutFeedback>

          }
          leftAction={() => { NavigationUtil.back(); }}
        />
        <View style={{height: 2, width:screenWidth, backgroundColor: colors.csOrange.hex}} />
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{flexGrow:1}}>
          <SlideFadeInView visible={this.state.devAppVisible} height={160}>
            <ListEditableItems items={getDevAppItems()} separatorIndent={true} />
          </SlideFadeInView>
          <ListEditableItems items={this._getItems()} separatorIndent={true} style={{flex:1}} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}


export function getDevAppItems() {
    let items = [];

    items.push({ label: "GO TO DEV APP", type: 'explanation' });
    items.push({
      label: "Go to dev app",
      type: 'button',
      style: { color: colors.black.hex, fontWeight: 'bold' },
      icon: <ScaledImage source={require('../../../../assets/images/icons/devAppIcon.png')} sourceHeight={180} sourceWidth={180} targetHeight={30}/>,
      callback: () => {
        OnScreenNotifications.removeAllNotifications();
        BroadcastStateManager.destroy();
        LocationHandler.destroy();
        core.eventBus.clearAllEvents();

        // reset the overlay manager events since we need these and we destroyed all events above.
        OverlayManager._initialized = false;
        OverlayManager.init()


        DevAppState.init();
        NavigationUtil.setRoot(Stacks.DEV_searchingForCrownstones());
      }
    });
    items.push({
      label: "This can brick your Crownstones. Beware! Your locationhandler will be _sessionIsKilled. Restart the app to go back to app mode.",
      type: 'explanation',
      below: true
    });
    items.push({
      label: "Developer Menu",
      icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueDark.hex }}/>,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("SettingsDeveloper", {fromOverview: true});
      }
    });
  items.push({
    label: "Debug options for developers.",
    type: 'explanation',
    below: true
  });
    return items;
}


async function shareData(shareDataType) {
  let storagePath = FileUtil.getPath();
  let options = {};
  if (shareDataType === EMAIL_DATA_TYPE.logs) {
    let filename = getLoggingFilename(Date.now(), LOG_PREFIX);
    options = {urls:[
        "file://" + storagePath + "/" + filename,
      ]}
  }
  else if (shareDataType === EMAIL_DATA_TYPE.localization) {
    let fingerprintPath = await LocalizationLogger.storeFingerprints();
    let logUrls = await LocalizationLogger.getURLS();
    logUrls.push(fingerprintPath);
    let urls = logUrls.map((a) => { return "file://" + a })
    options = {urls: urls }
  }
  else if (shareDataType === EMAIL_DATA_TYPE.allBuffers) {
    options = {urls:[
        "file://" + storagePath + '/power-samples-switchcraft-false-positive.log',
        "file://" + storagePath + '/power-samples-switchcraft-true-positive.log',
        "file://" + storagePath + '/power-samples-switchcraft-false-negative.log',
        "file://" + storagePath + '/power-samples-switchcraft-true-negative.log',
        "file://" + storagePath + '/power-samples-filteredData.log',
        "file://" + storagePath + '/power-samples-unfilteredData.log',
        "file://" + storagePath + '/power-samples-softFuseData.log',
      ]}
  }
  else if (shareDataType ===  EMAIL_DATA_TYPE.switchCraftBuffers) {
    options = {urls:[
        "file://" + storagePath + '/power-samples-switchcraft-false-positive.log',
        "file://" + storagePath + '/power-samples-switchcraft-true-positive.log',
        "file://" + storagePath + '/power-samples-switchcraft-false-negative.log',
        "file://" + storagePath + '/power-samples-switchcraft-true-negative.log',
      ]}
  }
  else if (shareDataType ===  EMAIL_DATA_TYPE.measurementBuffers) {
    options = {urls:[
        "file://" + storagePath + '/power-samples-filteredData.log',
        "file://" + storagePath + '/power-samples-unfilteredData.log',
      ]}
  }
  else if (shareDataType ===  EMAIL_DATA_TYPE.errorBuffers) {
    options = {urls:[
        "file://" + storagePath + '/power-samples-filteredData.log',
        "file://" + storagePath + '/power-samples-unfilteredData.log',
        "file://" + storagePath + '/power-samples-softFuseData.log',
      ]}
  }
  console.log(options)
  try {
    let result = await Share.open(options)
    console.log(result)
  }
  catch (err) {
    LOGw.info("Something went wrong while sharing data:",err)
  }
}
