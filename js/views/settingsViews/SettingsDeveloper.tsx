import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsDeveloper", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';

import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { colors } from '../styles'
import {Util} from "../../util/Util";
import {clearLogs} from "../../logging/LogUtil";

import {MeshUtil} from "../../util/MeshUtil";
import {CLOUD_ADDRESS} from "../../ExternalConfig";
import {Scheduler} from "../../logic/Scheduler";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";


export class SettingsDeveloper extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Developer")});
  }

  unsubscribe : any = [];

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
        icon: <IconButton name="ios-create" size={22} button={true} color="#fff"
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
        icon: <IconButton name="ios-create" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
        callback: () => {
          NavigationUtil.navigate( "SettingsLogging");
        }
      });
      items.push({
        label: lang("Clear_Logs_"),
        type: 'button',
        style: {color: colors.menuBackground.hex},
        icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuBackground.hex}}/>,
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



    items.push({label: lang("CLOUD"), type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: lang("Sync_Now_"),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="md-cloud-download" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback: () => {
        if (CLOUD.__currentlySyncing === false) {
          core.eventBus.emit("showLoading", lang("Syncing___"));
          CLOUD.sync(store, true)
            .then(() => { core.eventBus.emit("showLoading",lang("Done_")); setTimeout(() => { core.eventBus.emit("hideLoading");}, 500); })
            .catch((err) => { core.eventBus.emit("hideLoading"); Alert.alert(
              lang("_Error_during_sync__argum_header"),
              lang("_Error_during_sync__argum_body",err,err.message,JSON.stringify(err)),
              [{text:lang("_Error_during_sync__argum_left")}]) })
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
      icon: <IconButton name="ios-jet" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlueLight.hex}} />,
      callback:() => {
        core.eventBus.emit("showLoading", lang("Requesting_Notifications_"));

        let clearScheduledTimeout = null;
        let cleanup = null;
        let unsubscribe = core.eventBus.on("NotificationReceived", (data) => {
          if (data.type === "testNotification") {
            Alert.alert(
lang("_Notification_Received____header"),
lang("_Notification_Received____body"),
[{text:lang("_Notification_Received____left")}]);
            cleanup()
          }
        });

        this.unsubscribe.push(unsubscribe);

        clearScheduledTimeout = Scheduler.scheduleActiveCallback(() => {
          cleanup();
          Alert.alert(
lang("_Nothing_Received_____May_header"),
lang("_Nothing_Received_____May_body"),
[{text:lang("_Nothing_Received_____May_left")}]);
        }, 4000);

        cleanup = () => {
          clearScheduledTimeout();
          unsubscribe();
          core.eventBus.emit("hideLoading");
        };

        let deviceId = Util.data.getDeviceIdFromState(state, state.user.appIdentifier);
        if (deviceId) {
          CLOUD.forDevice(deviceId).sendTestNotification().catch((err) => {
            cleanup();
            Alert.alert(
lang("_Could_not_send_Request___header"),
lang("_Could_not_send_Request___body",JSON.stringify(err)),
[{text:lang("_Could_not_send_Request___left")}]);
          });
        }
        else {
          Alert.alert(
lang("_No_device_Id___There_was_header"),
lang("_No_device_Id___There_was_body"),
[{text:lang("_No_device_Id___There_was_left")}]);
          cleanup()
        }
      }});



    // let deviceId = Util.data.getCurrentDeviceId(state);
    // let device = deviceId && state.devices[deviceId] || null;
    items.push({label: lang("DEBUG_VIEWS"), type: 'explanation'});
    items.push({
      label: lang("BLE_Debug"),
      type: 'navigation',
      icon: <IconButton name="ios-build" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.lightBlue2.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsBleDebug");
      }});
    items.push({
      label: lang("Localization_Debug"),
      type: 'navigation',
      icon: <IconButton name="md-locate" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsLocalizationDebug");
      }});

    items.push({label: lang("ACTIVITY_LOGS"), type: 'explanation'});
    items.push({
      label: lang("Show_Full_Activity_Log"),
      value: dev.show_full_activity_log,
      type: 'switch',
      icon: <IconButton name="md-calendar" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkPurple.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_full_activity_log: newValue }});
      }});
    if (dev.show_full_activity_log) {
      items.push({
        label: lang("Show_only_own_activity"),
        value: dev.show_only_own_activity_log,
        type: 'switch',
        icon: <IconButton name="c1-people" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkerPurple.hex}} />,
        callback:(newValue) => {
          store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_only_own_activity_log: newValue }});
        }});
    }


    let broadcastLevels = [];
    for (let i = -16; i <= 14; i = i+2) {
      broadcastLevels.push({value: i, label: lang("_dB",i)});
    }

    items.push({ label: lang("BROADCASTING"), type: 'explanation', below: false });
    items.push({
      label: lang("Broadcasting"),
      value: dev.broadcasting_enabled,
      type: 'switch',
      icon: <IconButton name="md-wifi" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlueLight.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { broadcasting_enabled: newValue }});
      }});
    let deviceId = Util.data.getCurrentDeviceId(state);
    if (deviceId) {
      let device = state.devices[deviceId];
      items.push({
        type: 'dropdown',
        label: lang("RSSI_Offset"),
        dropdownHeight: 130,
        valueRight: true,
        buttons: true,
        icon: <IconButton name="ios-wifi" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
        valueStyle: { color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15 },
        value: device.rssiOffset,
        items: broadcastLevels,
        callback: (newValue) => {
          core.store.dispatch({ type: "SET_RSSI_OFFSET", deviceId: deviceId, data: {rssiOffset: newValue}})
        }
      })
    }
    else {
      items.push({ label: lang("No_Device_Available"), type: 'explanation', below: false });
    }


    items.push({label: lang("MESH"), type: 'explanation', below: false});
    items.push({
      label: lang("Change_Channels"),
      type: 'navigation',
      icon: <IconButton name="md-share" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsMeshDebug");
      }});
    items.push({
      label: lang("Show_RSSI_in_Topology"),
      value: dev.show_rssi_values_in_mesh,
      type: 'switch',
      icon: <IconButton name="ios-calculator" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.lightGreen.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_rssi_values_in_mesh: newValue }});
      }});
    items.push({
      label: lang("Reset_networks"),
      type:  'button',
      style: {color: colors.black.hex},
      icon:  <IconButton name="ios-nuclear" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
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
      icon: <IconButton name="md-share" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlueDark.hex}} />,
      callback:() => {
        NavigationUtil.navigate( "SettingsMeshTopology");
      }});

    if (user.betaAccess) {
      items.push({label: lang("ALPHA_FEATURES_WILL_LOOK_"), type: 'explanation', below: false});
    }
    else {
      items.push({label: lang("EXPERIMENTAL_FEATURES"), type: 'explanation', below: false});
    }
    items.push({
      label: lang("Join_Alpha_Program"),
      value: user.betaAccess,
      experimental: user.betaAccess,
      icon: <IconButton name={"ios-flask"} size={25} button={true} color={colors.white.hex} buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
      type: 'switch',
      callback:(newValue) => {
        let storeIt = () => {
          store.dispatch({
            type: 'SET_BETA_ACCESS',
            data: {betaAccess: newValue}
          });
        };
        if (newValue) {
          Alert.alert(
lang("_EXPERIMENTAL___Switchcra_header"),
lang("_EXPERIMENTAL___Switchcra_body"),
[{text:lang("_EXPERIMENTAL___Switchcra_left"), style:'cancel'}, {
text:lang("_EXPERIMENTAL___Switchcra_right"), onPress: storeIt}]
          );
        }
        else {
          storeIt();
        }
      }});
    items.push({label: lang("This_will_give_you_early_"), type: 'explanation', below: true});


    items.push({label: lang("RESET_DEVELOPER_STATE"), type: 'explanation', alreadyPadded: true});
    items.push({
      label: lang("Disable_Developer_Mode"),
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:() => {
        store.dispatch({
          type: 'SET_LOGGING',
          data: {logging: false}
        });
        store.dispatch({
          type: 'SET_DEVELOPER_MODE',
          data: {developer: false}
        });

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
      <Background image={core.background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
