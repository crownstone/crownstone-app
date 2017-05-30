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
import {CLOUD} from "../../cloud/cloudAPI";
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
    let items = [];

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
      label: 'Show the other people in your sphere in which room you are!',
      type: 'explanation',
      below: true
    });

    items.push({
      label:"Share switch state",
      value: user.uploadSwitchState,
      type: 'switch',
      icon: <IconButton name="md-power" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadSwitchState: newValue} });
      }});
    items.push({
      label: 'Show the other people in your sphere if the Crownstone is on or off!',
      type: 'explanation',
      below: true
    });

    items.push({
      label:"Share phone type details",
      value: user.uploadDeviceDetails,
      type: 'switch',
      icon: <IconButton name="ios-phone-portrait" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback:(newValue) => {
        if (newValue === false) {
          let deviceId = Util.data.getCurrentDeviceId(state);
          this.props.eventBus.emit("showLoading", "Removing phone details from the Cloud...");
          CLOUD.updateDevice(deviceId, {
            os: null,
            userAgent: null,
            deviceType: null,
            model: null,
            locale: null
          })
            .then(() => {
              this.props.eventBus.emit("showLoading", "Done!");
              setTimeout(() => {
                this.props.eventBus.emit("hideLoading");
                store.dispatch({ type: 'USER_UPDATE', data: {uploadDeviceDetails: newValue} });
                store.dispatch({ type: 'CLEAR_DEVICE_DETAILS', deviceId: deviceId, data: {
                  os: null,
                  userAgent: null,
                  deviceType: null,
                  model: null,
                  locale: null
                }});
                Alert.alert("Phone Details Removed", "We have removed your phone details from the Cloud.", [{text:'OK'}]);
              }, 500);
            })
            .catch((err) => {
              this.props.eventBus.emit("hideLoading");
              Alert.alert("Whoops!", "We could not remove your phone details from the Cloud. Please try again later.", [{text:'Fine...'}]);
            })
        }
        else {
          store.dispatch({ type: 'USER_UPDATE', data: { uploadDeviceDetails: newValue }});
        }
      }});
    items.push({
      label: 'Help us improve your experience by sharing what type of phone you have!',
      type: 'explanation',
      below: true
    });

    if (user.developer === true) {
      items.push({
        label: "WARNING HIGH BATTERY USAGE IF ENABLED:",
        type: 'explanation',
        below: false,
        alreadyPadded: true
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
