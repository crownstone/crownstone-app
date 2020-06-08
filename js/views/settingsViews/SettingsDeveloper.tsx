import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsDeveloper", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert, Platform,
  ScrollView, Text, TouchableWithoutFeedback, View
} from "react-native";

import { IconButton } from '../components/IconButton'
import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { colors, screenWidth } from "../styles";
import {Util} from "../../util/Util";
import {clearLogs} from "../../logging/LogUtil";

import {MeshUtil} from "../../util/MeshUtil";
import {CLOUD_ADDRESS} from "../../ExternalConfig";
import {Scheduler} from "../../logic/Scheduler";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Stacks } from "../../router/Stacks";
import { LocationHandler } from "../../native/localization/LocationHandler";
import { DevAppState } from "../../backgroundProcesses/dev/DevAppState";
import { ScaledImage } from "../components/ScaledImage";
import { TopbarImitation } from "../components/TopbarImitation";
import { topBarStyle } from "../components/topbar/TopbarStyles";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { BroadcastStateManager } from "../../backgroundProcesses/BroadcastStateManager";
import { OnScreenNotifications } from "../../notifications/OnScreenNotifications";
import { OverlayManager } from "../../backgroundProcesses/OverlayManager";


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


    this.state = { devAppVisible: state.development.devAppVisible && this.props.fromOverview !== true }
  }

  componentDidMount() {
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
    let now = new Date().valueOf();
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


    items.push({label: lang("LOGGING"), type: 'explanation', below: false});
    if (!dev.logging_enabled) {
      items.push({
        label: lang("Enable_Logging"),
        value: dev.logging_enabled,
        type: 'switch',
        icon: <IconButton name="ios-create" size={22}  color="#fff"
                          buttonStyle={{backgroundColor: colors.green2.hex}}/>,
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
      items.push({label: lang("Logging_will_keep_a_histo"), type: 'explanation', below: true});
    }
    else {
      items.push({
        label: lang("Logging_Configuration"),
        type: 'navigation',
        icon: <IconButton name="ios-create" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
        callback: () => {
          NavigationUtil.navigate( "SettingsLogging");
        }
      });
      items.push({
        label: lang("Clear_Logs_"),
        type: 'button',
        style: {color: colors.menuBackground.hex},
        icon: <IconButton name="ios-cut" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.menuBackground.hex}}/>,
        callback: () => {
          Alert.alert(
            lang("_Clear_all_Logs___Press_O_header"),
            lang("_Clear_all_Logs___Press_O_body"),
            [{text:lang("_Clear_all_Logs___Press_O_left"), style: 'cancel'},{
            text: lang("_Clear_all_Logs___Press_O_right"), onPress: () => {clearAllLogs();}}])
        }
      });
      items.push({label: lang("Logging_will_keep_a_histor"), type: 'explanation', below: true});
    }


    items.push({
      label: lang("View_uptime"),
      type: 'navigation',
      icon: <IconButton name="md-calendar" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.csBlue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsUptime")
      }
    });
    items.push({
      label: "View localization uptime",
      type: 'navigation',
      icon: <IconButton name="ios-home" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.black.hex}}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsLocalizationMonitor")
      }
    });
    items.push({label: lang("View_when_the_app_was_run"), type: 'explanation', below: true});


    items.push({label: lang("CLOUD"), type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: lang("Sync_Now_"),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="md-cloud-download" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback: () => {
        if (CLOUD.__currentlySyncing === false) {
          core.eventBus.emit("showLoading", lang("Syncing___"));
          CLOUD.sync(store, true)
            .then(() => { core.eventBus.emit("showLoading",lang("Done_")); setTimeout(() => { core.eventBus.emit("hideLoading");}, 500); })
            .catch((err) => { core.eventBus.emit("hideLoading"); Alert.alert(
              lang("_Error_during_sync__argum_header"),
              lang("_Error_during_sync__argum_body",err,err.message,JSON.stringify(err)),
              [{text:lang("_Error_during_sync__argum_left"), onPress: () => { core.eventBus.emit("hideLoading"); }}]) })
        }
        else {
          Alert.alert(
lang("_Sync_already_in_progress_header"),
lang("_Sync_already_in_progress_body"),
[{text:lang("_Sync_already_in_progress_left")}]);
        }
    }});
    items.push({
      label: lang("Test_Notifications"),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="ios-jet" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlueLight.hex}} />,
      callback:() => {
        core.eventBus.emit("showLoading", lang("Requesting_Notifications_"));

        let clearScheduledTimeout = null;
        let cleanup = null;
        let unsubscribe = core.eventBus.on("NotificationReceived", (data) => {
          if (data.type === "testNotification") {
            Alert.alert(
            lang("_Notification_Received____header"),
            lang("_Notification_Received____body"),
    [{text:lang("_Notification_Received____left"), onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
            cleanup()
          }
        });

        this.unsubscribe.push(unsubscribe);

        clearScheduledTimeout = Scheduler.scheduleActiveCallback(() => {
          cleanup();
          Alert.alert(
            lang("_Nothing_Received_____May_header"),
            lang("_Nothing_Received_____May_body"),
    [{text:lang("_Nothing_Received_____May_left"), onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
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
lang("_Could_not_send_Request___header"),
lang("_Could_not_send_Request___body",JSON.stringify(err)),
[{text:lang("_Could_not_send_Request___left"), onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
          });
        }
        else {
          Alert.alert(
            lang("_No_device_Id___There_was_header"),
            lang("_No_device_Id___There_was_body"),
            [{text:lang("_No_device_Id___There_was_left"), onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable:false});
          cleanup();
        }
      }});



    // let deviceId = Util.data.getCurrentDeviceId(state);
    // let device = deviceId && state.devices[deviceId] || null;
    items.push({label: lang("DEBUG_VIEWS"), type: 'explanation'});
    items.push({
      label: lang("BLE_Debug"),
      type: 'navigation',
      icon: <IconButton name="ios-build" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.lightBlue2.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsBleDebug");
      }});
    items.push({
      label: lang("Localization_Debug"),
      type: 'navigation',
      icon: <IconButton name="md-locate" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsLocalizationDebug");
      }})
    items.push({
      label: lang("Database_Explorer"),
      type: 'navigation',
      icon: <IconButton name="md-folder" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.iosBlueDark.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsDatabaseExplorer");
      }});

    items.push({label: lang("MESH"), type: 'explanation', below: false});
    items.push({
      label: lang("Change_Channels"),
      type: 'navigation',
      icon: <IconButton name="md-share" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsMeshDebug");
      }});
    items.push({
      label: lang("Show_RSSI_in_Topology"),
      value: dev.show_rssi_values_in_mesh,
      type: 'switch',
      icon: <IconButton name="ios-calculator" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.lightGreen.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_rssi_values_in_mesh: newValue }});
      }});
    items.push({
      label: lang("Reset_networks"),
      type:  'button',
      style: {color: colors.black.hex},
      icon:  <IconButton name="ios-nuclear" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback:() => {
        Alert.alert(
lang("_Are_you_sure___This_will_header"),
lang("_Are_you_sure___This_will_body"),
[{text:lang("_Are_you_sure___This_will_left"), onPress: () => {
              const store = core.store;
              const state = store.getState();
              let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
              MeshUtil.clearMeshNetworkIds(store, sphereId);
              MeshUtil.clearTopology(store, sphereId);
              Alert.alert(
lang("_Reset_Done__Rediscovery__header"),
lang("_Reset_Done__Rediscovery__body"),
[{text:lang("_Reset_Done__Rediscovery__left")}]);
            }},{text: lang("Cancel")}
          ]
        )
      }
    });
    items.push({
      label: lang("Mesh_Topology"),
      type: 'navigation',
      icon: <IconButton name="md-share" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.csBlueDark.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsMeshTopology");
      }});

    // if (user.betaAccess) {
    //   items.push({label: lang("ALPHA_FEATURES_WILL_LOOK_"), type: 'explanation', below: false});
    // }
    // else {
    //   items.push({label: lang("EXPERIMENTAL_FEATURES"), type: 'explanation', below: false});
    // }
//     items.push({
//       label: lang("Join_Alpha_Program"),
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
// lang("_EXPERIMENTAL___Switchcra_header"),
// lang("_EXPERIMENTAL___Switchcra_body"),
// [{text:lang("_EXPERIMENTAL___Switchcra_left"), style:'cancel'}, {
// text:lang("_EXPERIMENTAL___Switchcra_right"), onPress: storeIt}]
//           );
//         }
//         else {
//           storeIt();
//         }
//       }});
    // items.push({
    //   label: lang("FeaturePreview"),
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
    //         lang("_EXPERIMENTAL___Preview_header"),
    //         lang("_EXPERIMENTAL___Preview_body"),
    //         [{text:lang("_EXPERIMENTAL___Preview_left"), style:'cancel'}, {
    //           text:lang("_EXPERIMENTAL___Preview_right"), onPress: storeIt}]
    //       );
    //     }
    //     else {
    //       storeIt();
    //     }
    //   }});

    items.push({type:'spacer'});
    items.push({
      label: lang("Show_sync_button_for_beha"),
      value: dev.show_sync_button_in_behaviour,
      icon: <IconButton name={"md-refresh-circle"} size={25}  color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex}}/>,
      type: 'switch',
      callback:(newValue) => {
        store.dispatch({
          type: 'CHANGE_DEV_SETTINGS',
          data: {show_sync_button_in_behaviour: newValue}
        });
      }});


    items.push({label: lang("FIRMWARE_EARLY_ACCESS"), type: 'explanation'});
    items.push({
      label: lang("Beta_Firmware_Access"),
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
        label: lang("Alpha_Firmware_Access"),
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
    items.push({label: lang("WARNING__Early_access_bui"), type: 'explanation', below: true});


    items.push({label: lang("RESET_DEVELOPER_STATE"), type: 'explanation'});
    items.push({
      label: lang("Disable_Developer_Mode"),
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

        NavigationUtil.back();
    }});

    items.push({label: lang("CLOUD_URL__",CLOUD_ADDRESS), type: 'explanation'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu} hasTopBar={false} hideNotifications={true} hideOrangeLine={true} >
        <TopbarImitation
          left={Platform.OS === 'android' ? null : "Back"}
          title={ lang("test")}
          titleObject={

            <TouchableWithoutFeedback onPress={() => { this._countSecret() }}>
              <View style={{flex:1, width: screenWidth-160, alignItems:'center', justifyContent:'center'}}>
                <Text style={[topBarStyle.topBarCenter, topBarStyle.titleText]}>{ lang("Developer_Menu") }</Text>
              </View>
            </TouchableWithoutFeedback>

          }
          leftAction={() => { NavigationUtil.back(); }}
        />
        <View style={{height: 2, width:screenWidth, backgroundColor: colors.csOrange.hex}} />
        <ScrollView keyboardShouldPersistTaps="always">
          <SlideFadeInView visible={this.state.devAppVisible} height={160}>
            <ListEditableItems items={getDevAppItems()} separatorIndent={true} />
          </SlideFadeInView>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}


export function getDevAppItems() {
    let items = [];

    items.push({ label: lang("GO_TO_DEV_APP"), type: 'explanation' });
    items.push({
      label: lang("Go_to_dev_app"),
      type: 'button',
      style: { color: colors.black.hex, fontWeight: 'bold' },
      icon: <ScaledImage source={require('../../images/icons/devAppIcon.png')} sourceHeight={180} sourceWidth={180} targetHeight={30}/>,
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
      label: lang("This_can_brick_your_Crown"),
      type: 'explanation',
      below: true
    });
    items.push({
      label: lang("Developer_Menu"),
      icon: <IconButton name={"md-code-working"} size={25} color={colors.white.hex} buttonStyle={{ backgroundColor: colors.csBlueDark.hex }}/>,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate("SettingsDeveloper", {fromOverview: true});
      }
    });
  items.push({
    label: lang("Debug_options_for_develop"),
    type: 'explanation',
    below: true
  });
    return items;
}

