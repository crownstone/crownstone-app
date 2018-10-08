import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Actions } from 'react-native-router-flux';
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { colors } from '../styles'
import {Util} from "../../util/Util";
import {clearLogs} from "../../logging/LogUtil";
import {BackAction} from "../../util/Back";
import {MeshUtil} from "../../util/MeshUtil";
import {CLOUD_ADDRESS} from "../../ExternalConfig";
import {Scheduler} from "../../logic/Scheduler";


export class SettingsDeveloper extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: Languages.title("SettingsDeveloper", "Developer")(),
    }
  };

  unsubscribe : any = [];

  componentDidMount() {
    this.unsubscribe.push(this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeviceData || change.changeDeveloperData || change.changeUserData || change.changeUserDeveloperStatus || change.changeAppSettings || change.stoneRssiUpdated) {
        this.forceUpdate();
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((unsub) => { unsub() });
  }

  
  _getItems() {
    const store = this.props.store;
    let state = store.getState();
    let user = state.user;
    let dev = state.development;

    let items = [];
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({label: Languages.label("SettingsDeveloper", "LOGGING")(), type: 'explanation', below: false});
    if (!dev.logging_enabled) {
      items.push({
        label: Languages.label("SettingsDeveloper", "Enable_Logging")(),
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
      items.push({label: Languages.label("SettingsDeveloper", "Logging_will_keep_a_histo")(), type: 'explanation', below: true});
    }
    else {
      items.push({
        label: Languages.label("SettingsDeveloper", "Logging_Configuration")(),
        type: 'navigation',
        icon: <IconButton name="ios-create" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
        callback: () => {
          Actions.settingsLogging()
        }
      });
      items.push({
        label: Languages.label("SettingsDeveloper", "Clear_Logs_")(),
        type: 'button',
        style: {color: colors.menuBackground.hex},
        icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuBackground.hex}}/>,
        callback: () => {
          Alert.alert(
Languages.alert("SettingsDeveloper", "_Clear_all_Logs___Press_O_header")(),
Languages.alert("SettingsDeveloper", "_Clear_all_Logs___Press_O_body")(),
[{text:Languages.alert("SettingsDeveloper", "_Clear_all_Logs___Press_O_left")(), style: 'cancel'},{
text: Languages.alert("SettingsDeveloper", "_Clear_all_Logs___Press_O_right")(), onPress: () => {clearAllLogs();}}])
        }
      });
      items.push({label: Languages.label("SettingsDeveloper", "Logging_will_keep_a_histor")(), type: 'explanation', below: true});
    }



    items.push({label: Languages.label("SettingsDeveloper", "CLOUD")(), type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: Languages.label("SettingsDeveloper", "Sync_Now_")(),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="md-cloud-download" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback: () => {
        if (CLOUD.__currentlySyncing === false) {
          this.props.eventBus.emit("showLoading","Syncing...");
          CLOUD.sync(store, true)
            .then(() => { this.props.eventBus.emit("showLoading","Done!"); setTimeout(() => { this.props.eventBus.emit("hideLoading");}, 500); })
            .catch((err) => { this.props.eventBus.emit("hideLoading"); Alert.alert(
Languages.alert("SettingsDeveloper", "_Error_during_sync__argum_header")(),
Languages.alert("SettingsDeveloper", "_Error_during_sync__argum_body")(err,err.message,JSON.stringify(err)),
[{text:Languages.alert("SettingsDeveloper", "_Error_during_sync__argum_left")()}]) })
        }
        else {
          Alert.alert(
Languages.alert("SettingsDeveloper", "_Sync_already_in_progress_header")(),
Languages.alert("SettingsDeveloper", "_Sync_already_in_progress_body")(),
[{text:Languages.alert("SettingsDeveloper", "_Sync_already_in_progress_left")()}]);
        }
    }});
    items.push({
      label: Languages.label("SettingsDeveloper", "Test_Notifications")(),
      type: 'button',
      style: {color: colors.black.hex},
      icon: <IconButton name="ios-jet" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlueLight.hex}} />,
      callback:() => {
        this.props.eventBus.emit("showLoading", "Requesting Notifications...");

        let clearScheduledTimeout = null;
        let cleanup = null;
        let unsubscribe = this.props.eventBus.on("NotificationReceived", (data) => {
          if (data.type === "testNotification") {
            Alert.alert(
Languages.alert("SettingsDeveloper", "_Notification_Received____header")(),
Languages.alert("SettingsDeveloper", "_Notification_Received____body")(),
[{text:Languages.alert("SettingsDeveloper", "_Notification_Received____left")()}]);
            cleanup()
          }
        });

        this.unsubscribe.push(unsubscribe);

        clearScheduledTimeout = Scheduler.scheduleActiveCallback(() => {
          cleanup()
          Alert.alert(
Languages.alert("SettingsDeveloper", "_Nothing_Received_____May_header")(),
Languages.alert("SettingsDeveloper", "_Nothing_Received_____May_body")(),
[{text:Languages.alert("SettingsDeveloper", "_Nothing_Received_____May_left")()}]);
        }, 4000);

        cleanup = () => {
          clearScheduledTimeout()
          unsubscribe()
          this.props.eventBus.emit("hideLoading");
        }

        let deviceId = Util.data.getDeviceIdFromState(state, state.user.appIdentifier)
        if (deviceId) {
          CLOUD.forDevice(deviceId).sendTestNotification().catch((err) => {
            cleanup();
            Alert.alert(
Languages.alert("SettingsDeveloper", "_Could_not_send_Request___header")(),
Languages.alert("SettingsDeveloper", "_Could_not_send_Request___body")(JSON.stringify(err)),
[{text:Languages.alert("SettingsDeveloper", "_Could_not_send_Request___left")()}]);
          });
        }
        else {
          Alert.alert(
Languages.alert("SettingsDeveloper", "_No_device_Id___There_was_header")(),
Languages.alert("SettingsDeveloper", "_No_device_Id___There_was_body")(),
[{text:Languages.alert("SettingsDeveloper", "_No_device_Id___There_was_left")()}]);
          cleanup()
        }
      }});



    // let deviceId = Util.data.getCurrentDeviceId(state);
    // let device = deviceId && state.devices[deviceId] || null;
    items.push({label: Languages.label("SettingsDeveloper", "DEBUG_VIEWS")(), type: 'explanation'});
    items.push({
      label: Languages.label("SettingsDeveloper", "BLE_Debug")(),
      type: 'navigation',
      icon: <IconButton name="ios-build" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.lightBlue2.hex}} />,
      callback:() => {
        Actions.settingsBleDebug()
      }});
    items.push({
      label: Languages.label("SettingsDeveloper", "Localization_Debug")(),
      type: 'navigation',
      icon: <IconButton name="md-locate" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback:() => {
        Actions.settingsLocalizationDebug()
      }});

    items.push({label: Languages.label("SettingsDeveloper", "ACTIVITY_LOGS")(), type: 'explanation'});
    items.push({
      label: Languages.label("SettingsDeveloper", "Show_Full_Activity_Log")(),
      value: dev.show_full_activity_log,
      type: 'switch',
      icon: <IconButton name="md-calendar" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkPurple.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_full_activity_log: newValue }});
      }});
    if (dev.show_full_activity_log) {
      items.push({
        label: Languages.label("SettingsDeveloper", "Show_only_own_activity")(),
        value: dev.show_only_own_activity_log,
        type: 'switch',
        icon: <IconButton name="c1-people" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkerPurple.hex}} />,
        callback:(newValue) => {
          store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_only_own_activity_log: newValue }});
        }});
    }

    items.push({label: Languages.label("SettingsDeveloper", "DO_NOT_USE")(), type: 'explanation'});
    items.push({
      label: Languages.label("SettingsDeveloper", "Use_Advertisement_RSSI")(),
      value: dev.use_advertisement_rssi_too,
      type: 'switch',
      icon: <IconButton name="md-git-network" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.purple.hex}} />,
      callback:(newValue) => {
        let execute = () => {
          store.dispatch({
            type: 'CHANGE_DEV_SETTINGS',
            data: {
              use_advertisement_rssi_too: newValue,
            }
          });
        };

        if (newValue === true) {
          Alert.alert(
Languages.alert("SettingsDeveloper", "_Are_you_sure___Only_enab_header")(),
Languages.alert("SettingsDeveloper", "_Are_you_sure___Only_enab_body")(),
[{text:Languages.alert("SettingsDeveloper", "_Are_you_sure___Only_enab_left")()}, {
text:Languages.alert("SettingsDeveloper", "_Are_you_sure___Only_enab_right")(), onPress: execute}])
        }
        else {
          execute();
        }
      }});
    items.push({label: Languages.label("SettingsDeveloper", "By_default_we_use_iBeacon")(), type: 'explanation', below: true});


    items.push({label: Languages.label("SettingsDeveloper", "MESH")(), type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: Languages.label("SettingsDeveloper", "Change_Channels")(),
      type: 'navigation',
      icon: <IconButton name="md-share" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
      callback:() => {
        Actions.settingsMeshDebug()
      }});
    items.push({
      label: Languages.label("SettingsDeveloper", "Show_RSSI_in_Topology")(),
      value: dev.show_rssi_values_in_mesh,
      type: 'switch',
      icon: <IconButton name="ios-calculator" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.lightGreen.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'CHANGE_DEV_SETTINGS', data: { show_rssi_values_in_mesh: newValue }});
      }});
    items.push({
      label: Languages.label("SettingsDeveloper", "Reset_networks")(),
      type:  'button',
      style: {color: colors.black.hex},
      icon:  <IconButton name="ios-nuclear" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkGreen.hex}} />,
      callback:() => {
        Alert.alert(
Languages.alert("SettingsDeveloper", "_Are_you_sure___This_will_header")(),
Languages.alert("SettingsDeveloper", "_Are_you_sure___This_will_body")(),
[{text:Languages.alert("SettingsDeveloper", "_Are_you_sure___This_will_left")(), onPress: () => {
              const store = this.props.store;
              const state = store.getState();
              let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
              MeshUtil.clearMeshNetworkIds(store, sphereId);
              MeshUtil.clearTopology(store, sphereId);
              Alert.alert(
Languages.alert("SettingsDeveloper", "_Reset_Done__Rediscovery__header")(),
Languages.alert("SettingsDeveloper", "_Reset_Done__Rediscovery__body")(),
[{text:Languages.alert("SettingsDeveloper", "_Reset_Done__Rediscovery__left")()}]);
            }},{text: Languages.label("SettingsDeveloper", "Cancel")()}
          ]
        )
      }
    });

    if (user.betaAccess) {
      items.push({label: Languages.label("SettingsDeveloper", "ALPHA_FEATURES_WILL_LOOK_")(), type: 'explanation', below: false});
    }
    else {
      items.push({label: Languages.label("SettingsDeveloper", "EXPERIMENTAL_FEATURES")(), type: 'explanation', below: false});
    }
    items.push({
      label: Languages.label("SettingsDeveloper", "Join_Alpha_Program")(),
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
        }
        if (newValue) {
          Alert.alert(
Languages.alert("SettingsDeveloper", "_EXPERIMENTAL___Switchcra_header")(),
Languages.alert("SettingsDeveloper", "_EXPERIMENTAL___Switchcra_body")(),
[{text:Languages.alert("SettingsDeveloper", "_EXPERIMENTAL___Switchcra_left")(), style:'cancel'}, {
text:Languages.alert("SettingsDeveloper", "_EXPERIMENTAL___Switchcra_right")(), onPress: storeIt}]
          );
        }
        else {
          storeIt();
        }
      }});
    items.push({label: Languages.label("SettingsDeveloper", "This_will_give_you_early_")(), type: 'explanation', below: true});


    items.push({label: Languages.label("SettingsDeveloper", "RESET_DEVELOPER_STATE")(), type: 'explanation', alreadyPadded: true});
    items.push({
      label: Languages.label("SettingsDeveloper", "Disable_Developer_Mode")(),
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

        BackAction();
    }});

    items.push({label: Languages.label("SettingsDeveloper", "CLOUD_URL__")(CLOUD_ADDRESS), type: 'explanation'});
    items.push({type: 'spacer'});
    items.push({type: 'spacer'});


    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
