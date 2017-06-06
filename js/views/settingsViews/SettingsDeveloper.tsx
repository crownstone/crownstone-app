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
const RNFS = require('react-native-fs');


export class SettingsDeveloper extends Component<any, any> {
  unsubscribe : any;
  renderState : any;

  constructor() {
    super();
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeviceData || change.changeDeveloperData || change.changeUserData) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  
  _getItems(user) {
    const store = this.props.store;
    let state = store.getState();
    let items = [];
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({label: "LOGGING", type: 'explanation', below: false});
    items.push({
      label:"Enable Logging",
      value: user.logging,
      type: 'switch',
      icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
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
      items.push({
        label: "Clear Logs!",
        type: 'button',
        style: {color: colors.darkGreen.hex},
        icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkGreen.hex}}/>,
        callback: (newValue) => {
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
        this.props.eventBus.emit("showLoading","Syncing...");
        CLOUD.sync(store, true)
          .then(() => { this.props.eventBus.emit("showLoading","Done!"); setTimeout(() => { this.props.eventBus.emit("hideLoading");}, 500); })
          .catch((err) => { this.props.eventBus.emit("hideLoading"); Alert.alert("Error during sync.", err && err.message || JSON.stringify(err), [{text:'OK'}]) })
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
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;
    this.renderState = state; // important for performance check

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
