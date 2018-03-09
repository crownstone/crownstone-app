import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Platform,
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
import { LOG } from '../../logging/Log'
import { styles, colors } from '../styles'
import {Util} from "../../util/Util";
import {NotificationHandler} from "../../backgroundProcesses/NotificationHandler";
import {KEEPALIVE_INTERVAL} from "../../ExternalConfig";
import {KeepAliveHandler} from "../../backgroundProcesses/KeepAliveHandler";
import {LocationHandler} from "../../native/localization/LocationHandler";


export class SettingsApp extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "App Settings" }
  };

  unsubscribe : any;
  initialKeepAliveState = false;
  triggerTapToToggleCalibration = false;


  _getKeepAliveState() {
    let state = this.props.store.getState();
    return state.app.indoorLocalizationEnabled && state.app.keepAlivesEnabled;
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeAppSettings) {
        this.forceUpdate();
      }
    });

    this.initialKeepAliveState = this._getKeepAliveState();
  }

  componentWillUnmount() {
    let currentKeepAliveState = this._getKeepAliveState();
    if (currentKeepAliveState !== this.initialKeepAliveState) {
      if (currentKeepAliveState === true) {
        KeepAliveHandler.fireTrigger();
      }
      else {
        let state = this.props.store.getState();
        KeepAliveHandler.clearCurrentKeepAlives();
        LocationHandler._removeUserFromAllRooms(state, state.user.userId);
      }
    }

    this.unsubscribe();

    if (this.triggerTapToToggleCalibration) {
      this.props.eventBus.emit("CalibrateTapToToggle");
    }
  }

  
  _getItems() {
    const store = this.props.store;
    let state = store.getState();

    let items = [];
    items.push({label: "FEATURES", type: 'explanation', below: false});
    items.push({
      label:"Use Tap To Toggle",
      value: state.app.tapToToggleEnabled,
      type: 'switch',
      icon: <IconButton name="md-color-wand" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'UPDATE_APP_SETTINGS',
          data: {tapToToggleEnabled: newValue}
        });
        if (newValue === true) {
          // if we turn it on, we have to setup the training if the user has not already trained this.
          let tapToToggleCalibration = Util.data.getTapToToggleCalibration(state);
          if (!tapToToggleCalibration) {
            this.triggerTapToToggleCalibration = true;
          }
        }
        else {
          this.triggerTapToToggleCalibration = false;
        }
    }});
    if (state.app.indoorLocalizationEnabled) {
      items.push({label: "Tap to toggle allows you to hold your phone against a Crownstone to toggle it automatically!", type: 'explanation', below: true});
    }
    else {
      items.push({label: "If indoor localization is disabled, tap to toggle does only work when the app is on the screen.", type: 'explanation', below: true});
    }


    items.push({label: "BATTERY USAGE", type: 'explanation', alreadyPadded: true, below: false});
    items.push({
      label:"Use Heartbeat",
      value: state.app.keepAlivesEnabled && state.app.indoorLocalizationEnabled,
      disabled: !state.app.indoorLocalizationEnabled,
      type: 'switch',
      icon: <IconButton name="ios-heart" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'UPDATE_APP_SETTINGS',
          data: {keepAlivesEnabled: newValue}
        });
      }});
    if (state.app.indoorLocalizationEnabled) {
      items.push({label: "The heartbeat is part of the indoor localization process. Every now and then, the app will tell the Crownstones that you're still there." +
      "\n\nThis is used for the following behaviours:" +
      "\n  - Exit Sphere" +
      "\n  - Exit Room" +
      "\n\nIf you disable the heartbeat and another user is using it with the exit events, the Crownstones can turn off when that user leaves the house (according to their behaviour).",
        type: 'explanation', below: true});
    }
    else {
      items.push({label: "The heartbeat is part of the indoor localization process. If indoor localization is disabled, the heartbeat will also be disabled.",
        type: 'explanation', below: true});
    }

    if (Platform.OS !== 'android') {
      items.push({
        label: "Use Indoor localization",
        value: state.app.indoorLocalizationEnabled,
        type: 'switch',
        icon: <IconButton name="c1-locationPin1" size={18} button={true} color="#fff"
                          buttonStyle={{backgroundColor: colors.blue.hex}}/>,
        callback: (newValue) => {
          store.dispatch({
            type: 'UPDATE_APP_SETTINGS',
            data: {indoorLocalizationEnabled: newValue}
          });

          LOG.info("BackgroundProcessHandler: Set background processes to", newValue);
          Bluenet.setBackgroundScanning(newValue);

          if (newValue === false) {
            // REMOVE USER FROM ALL SPHERES AND ALL LOCATIONS.
            let deviceId = Util.data.getCurrentDeviceId(state);
            if (deviceId) {
              CLOUD.forDevice(deviceId).updateDeviceSphere(null).catch(() => { });
              CLOUD.forDevice(deviceId).updateDeviceLocation(null).catch(() => { });
            }
          }
        }
      });
      items.push({
        label: "Indoor localization allows the Crownstones to react to: " +
        "\n  - Enter/Exit Sphere" +
        "\n  - Enter/Exit Room" +
        "\n  - Your distance to the Crownstone (Near and Away) " +
        "\n  - Tap to Toggle" +
        "\n\nTo do this, the app has to run in the background. If you are in the Sphere, this can use more power than an average app." +
        "\n\nIf you do not wish to make use of any of the behaviours listed above, you can disable Indoor Localization and use the app as a remote control.\n\n",
        type: 'explanation',
        below: true
      });
    }
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
