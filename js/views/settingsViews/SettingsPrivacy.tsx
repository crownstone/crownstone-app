import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { LOG, clearLogs } from '../../logging/Log'
import { styles, colors } from '../styles'
import { Util } from "../../util/Util";
// import { NotificationHandler } from "../../notifications/NotificationHandler";


export class SettingsPrivacy extends Component<any, any> {
  unsubscribe : any;
  renderState : any;

  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (this.renderState && (this.renderState.user != state.user || this.renderState.devices != state.devices)) {
        // LOG.info("Force Update Profile", this.renderState.user, state.user)
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  
  _getItems(user) {
    const store = this.props.store;
    let state = store.getState();
    console.log("state", state);
    let items = [];
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };
    let deviceId = Util.data.getCurrentDeviceId(state);
    let device = state.devices[deviceId];
    console.log(deviceId, device, Util.data.getDeviceSpecs(state));

    items.push({type: 'spacer'});
    items.push({
      label:"Share location",
      value: user.uploadLocation,
      type: 'switch',
      icon: <IconButton name="ios-pin" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadLocation: newValue} });
    }});

    items.push({
      label:"Share switch state",
      value: user.uploadSwitchState,
      type: 'switch',
      icon: <IconButton name="md-power" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />,
      callback:(newValue) => {
        if (newValue === false) {
          clearAllLogs();
        }
        store.dispatch({ type: 'USER_UPDATE', data: {uploadSwitchState: newValue} });
      }});

    if (user.developer === true) {
      items.push({
        label: "WARNING HIGH BATTERY USAGE IF ENABLED:",
        type: 'explanation',
        below: false
      });
      items.push({
        label: "Share power usage",
        value: user.uploadPowerUsage,
        type: 'switch',
        icon: <IconButton name="ios-flash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
        callback: (newValue) => { store.dispatch({type: 'USER_UPDATE', data: {uploadPowerUsage: newValue}}); }
      });
      items.push({
        label: "You can choose what you want to share with the cloud and what you prefer to keep on your phone.\n\n" +
        "If you have multiple users in a Sphere, sharing location is required to see them in the overview.",
        type: 'explanation',
        below: true
      });


      // items.push({
      //   label: "ENABLE THIS DEVICE AS HUB",
      //   type: 'explanation',
      //   below: false
      // });
      // items.push({
      //   label: "Hub",
      //   value: device.hubFunction,
      //   type: 'switch',
      //   icon: <IconButton name="md-cloudy" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.csOrange.hex}}/>,
      //   callback: (newValue) => {
      //     if (newValue === true) {
      //       NotificationHandler.request();
      //     }
      //     else {
      //
      //     }
      //     store.dispatch({type: 'UPDATE_DEVICE_CONFIG', deviceId: deviceId, data: { hubFunction: newValue }});
      //   }
      // });
      // items.push({
      //   label: "If this device can be used as a hub, it can respond to switchRemotely commands from the Crownstone Cloud API.",
      //   type: 'explanation',
      //   below: true
      // });

    }

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
