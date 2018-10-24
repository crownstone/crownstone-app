
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsApp", key)(a,b,c,d,e);
}
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

import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import {colors, OrangeLine} from '../styles'
import {Util} from "../../util/Util";
import {KeepAliveHandler} from "../../backgroundProcesses/KeepAliveHandler";
import {LocationHandler} from "../../native/localization/LocationHandler";


export class SettingsApp extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: lang("App_Settings")}
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
    items.push({label: lang("FEATURES"), type: 'explanation', below: false});
    items.push({
      label: lang("Use_Tap_To_Toggle"),
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
      items.push({label: lang("Tap_to_toggle_allows_you_"), type: 'explanation', below: true});
    }
    else {
      items.push({label: lang("If_indoor_localization_is"), type: 'explanation', below: true});
    }


    items.push({label: lang("BATTERY_USAGE"), type: 'explanation', alreadyPadded: true, below: false});
    items.push({
      label: lang("Use_Heartbeat"),
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
      items.push({label: lang("The_heartbeat_is_part_of_"),
        type: 'explanation', below: true});
    }
    else {
      items.push({label: lang("The_heartbeat_is_part_of_t"),
        type: 'explanation', below: true});
    }

    items.push({
      label: lang("Use_Indoor_localization"),
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
            CLOUD.forDevice(deviceId).exitSphere("*").catch(() => { });  // will also clear location
          }
        }
      }
    });
    items.push({
      label: lang("Indoor_localization_allow"),
      type: 'explanation',
      below: true
    });
    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
