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


export class SettingsDeveloper extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Developer",
    }
  };

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeviceData || change.changeDeveloperData || change.changeUserData || change.changeUserDeveloperStatus || change.changeAppSettings || change.stoneRssiUpdated) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  
  _getItems() {
    const store = this.props.store;
    let state = store.getState();
    let user = state.user;
    let dev = state.development;

    let items = [];
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({label: "LOGGING", type: 'explanation', below: false});
    items.push({
      label:"Enable Logging",
      value: user.logging,
      type: 'switch',
      icon: <IconButton name="ios-create" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
      if (newValue === false) {
        clearAllLogs();
      }
      store.dispatch({
        type: 'SET_LOGGING',
        data: {logging: newValue}
      });
      Bluenet.enableLoggingToFile(newValue);
    }});

    if (user.logging) {
      items.push({label: "ADDITIONAL LOGGING", type: 'explanation', below: false});
      items.push({
        label:"Debug",
        value: dev.log_debug && dev.log_verbose,
        type: 'switch',
        icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        callback:(newValue) => {
          store.dispatch({
            type: 'DEFINE_LOGGING_DETAILS',
            data: {log_debug: newValue, log_verbose: newValue}
          });
        }});
      items.push({
        label:"Store & Cloud",
        value: dev.log_store && dev.log_cloud,
        type: 'switch',
        icon: <IconButton name="ios-cloud" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        callback:(newValue) => {
          store.dispatch({
            type: 'DEFINE_LOGGING_DETAILS',
            data: {log_store: newValue, log_cloud: newValue}
          });
        }});
      items.push({
        label:"BLE Advertisements",
        value: dev.log_ble,
        type: 'switch',
        icon: <IconButton name="ios-bluetooth" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        callback:(newValue) => {
          Bluenet.enableExtendedLogging(newValue);
          store.dispatch({
            type: 'DEFINE_LOGGING_DETAILS',
            data: {log_ble: newValue}
          });
        }});
      items.push({
        label:"Scheduler & Events",
        value: dev.log_scheduler &&  dev.log_events,
        type: 'switch',
        icon: <IconButton name="md-clipboard" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        callback:(newValue) => {
          store.dispatch({
            type: 'DEFINE_LOGGING_DETAILS',
            data: {
              log_scheduler: newValue,
              log_events: newValue,
            }
          });
        }});
      items.push({
        label: "Clear Logs!",
        type: 'button',
        style: {color: colors.menuBackground.hex},
        icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.menuBackground.hex}}/>,
        callback: () => {
          Alert.alert("Clear all Logs?", "Press OK to clear logs.", [{text:'Cancel', style: 'cancel'},{text: 'OK', onPress: () => {clearAllLogs();}}])
        }
      });
    }
    items.push({label: "Logging will keep a history of what the app is doing for the last 3 days.", type: 'explanation', below: true});


    items.push({label: "CLOUD", type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label:"Sync Now!",
      type: 'button',
      style: {color: colors.blue.hex},
      icon: <IconButton name="md-cloud-download" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback:(newValue) => {
        if (CLOUD.__currentlySyncing === false) {
          this.props.eventBus.emit("showLoading","Syncing...");
          CLOUD.sync(store, true)
            .then(() => { this.props.eventBus.emit("showLoading","Done!"); setTimeout(() => { this.props.eventBus.emit("hideLoading");}, 500); })
            .catch((err) => { this.props.eventBus.emit("hideLoading"); Alert.alert("Error during sync.", err && err.message || JSON.stringify(err), [{text:'OK'}]) })
        }
        else {
          Alert.alert("Sync already in progress.","There already is an active syncing process running in the background. Syncing can take a long time if there are a lot op power measurements that require syncing.", [{text:'OK'}]);
        }
    }});


    let deviceId = Util.data.getCurrentDeviceId(state);
    let device = deviceId && state.devices[deviceId] || null;
    if (device) {
      items.push({
        label:"Use as Hub",
        value: device.hubFunction,
        type: 'switch',
        icon: <IconButton name="md-cube" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
        callback:(newValue) => {
          store.dispatch({
            type: 'UPDATE_DEVICE_CONFIG',
            deviceId: deviceId,
            data: {hubFunction: newValue}
          });
        }});
      items.push({label: "A Hub will use push notifications from the cloud to toggle your devices remotely.", type: 'explanation', below: true});
    }
    else {
      items.push({label: "No device available... Try triggering a sync?", type: 'explanation', below: true});
    }


    items.push({
      label:"BLE Debug",
      type: 'navigation',
      icon: <IconButton name="ios-build" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkPurple.hex}} />,
      callback:() => {
        Actions.settingsBleDebug()
      }});
    items.push({
      label:"Use Advertisement RSSI",
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
          Alert.alert("Are you sure?", "Only enable this if you know what you're doing!",[{text:"Nevermind..."}, {text:"Do it.", onPress: execute}])
        }
        else {
          execute();
        }
      }});
    items.push({label: "By default we use iBeacon RSSI values since they are averaged. When enabled, we will ALSO use the RSSI values from advertisements. Advertisment RSSI values only come in in the foreground.", type: 'explanation', below: true});


    items.push({label: "MESH", type: 'explanation', below: false, alreadyPadded: true});
    items.push({
      label: 'Reset networks',
      type:  'button',
      style: {color: colors.black.hex},
      icon:  <IconButton name="ios-nuclear" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkGreen.hex}} />,
      callback:() => {
        Alert.alert("Are you sure?", "This will reset all mesh networks in the current Sphere.",
          [
            {text:"Do it.", onPress: () => {
              const store = this.props.store;
              const state = store.getState();
              let sphereId = state.app.activeSphere || Util.data.getPresentSphereId(state) || Object.keys(state.spheres)[0];
              MeshUtil.clearMeshNetworkIds(store, sphereId);
              MeshUtil.clearTopology(store, sphereId);
              Alert.alert("Reset Done", "Rediscovery will start automatically.",[{text:"OK"}]);
            }},{text:"Cancel"}
          ]
        )
      }
    });

    if (user.betaAccess) {
      items.push({label: 'ALPHA FEATURES WILL LOOK LIKE THIS', type: 'explanation', below: false});
    }
    else {
      items.push({label: 'EXPERIMENTAL FEATURES', type: 'explanation', below: false});
    }
    items.push({
      label:'Join Alpha Program',
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
            "EXPERIMENTAL!",
            "Switchcraft is currently in the experimental phase. It will not detect all switches, " +
            "it might switch accidentally or your Built-in Crownstone might be unsupported.\n\n" +
            "Use this at your own risk! Are you sure?",
            [{text:"I'll wait.", style:'cancel'}, {text:"Yes.", onPress: storeIt}]
          );
        }
        else {
          storeIt();
        }
      }});
    items.push({label: 'This will give you early access to new experimental features!', type: 'explanation', below: true});


    items.push({label: "RESET DEVELOPER STATE", type: 'explanation', alreadyPadded: true});
    items.push({
      label:"Disable Developer Mode",
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'SET_DEVELOPER_MODE',
          data: {developer: false}
        });

        clearAllLogs();
        Bluenet.enableLoggingToFile(false);

        BackAction();
    }});
    items.push({label: "Revert back to the normal user state.", type: 'explanation', below: true});

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
