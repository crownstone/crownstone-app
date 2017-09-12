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
import { LOG, clearLogs } from '../../logging/Log'
import { styles, colors } from '../styles'
import {Util} from "../../util/Util";
import {NotificationHandler} from "../../backgroundProcesses/NotificationHandler";


export class SettingsDeveloper extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeviceData || change.changeDeveloperData || change.changeUserData || change.changeUserDeveloperStatus || change.changeAppSettings) {
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
          Alert.alert("Clear all Logs?", "Press OK to clear logs.", [{text:'Cancel'},{text: 'OK', onPress: () => {clearAllLogs();}}])
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
          if (newValue === true) {
            NotificationHandler.request();
          }
        }});
      items.push({label: "A Hub will use push notifications from the cloud to toggle your devices remotely.", type: 'explanation', below: true});
    }
    else {
      items.push({label: "No device available... Try triggering a sync?", type: 'explanation', below: true});
    }


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

        Actions.pop();
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
