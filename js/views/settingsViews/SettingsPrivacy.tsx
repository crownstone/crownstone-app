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
import { LOG } from '../../logging/Log'
import {styles, colors, screenWidth} from '../styles'
import { Util } from "../../util/Util";
import {CLOUD} from "../../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL, SYNC_INTERVAL} from "../../ExternalConfig";
// import { NotificationHandler } from "../../notifications/NotificationHandler";


export class SettingsPrivacy extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Privacy" }
  };

  unsubscribe : any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData) {
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


    items.push({
      label: "You can choose what you want to share with the cloud and what you prefer to keep on your phone.\n\n" +
      "If you have multiple users in a Sphere, sharing location is required to see them in the overview.",
      type: 'largeExplanation',
      style:{paddingTop:15, paddingBottom:15}
    });
    items.push({
      label:"Share location",
      value: user.uploadLocation,
      type: 'switch',
      icon: <IconButton name="ios-pin" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadLocation: newValue} });
    }});
    items.push({
      label: 'Show the other people in your Sphere in which room you are!',
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
      label:"Share diagnostics",
      value: user.uploadDiagnostics,
      type: 'switch',
      icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkBackground.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadDiagnostics: newValue} });
      }});
    items.push({
      label: 'Help us gather statistics on the health of your Crownstones!',
      type: 'explanation',
      below: true
    });
    items.push({
      label: "Share power usage",
      value: user.uploadPowerUsage,
      type: 'switch',
      icon: <IconButton name="ios-flash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: (newValue) => { store.dispatch({type: 'USER_UPDATE', data: {uploadPowerUsage: newValue}}); }
    });
    if (user.uploadPowerUsage) {
      items.push({
        label: "Upload frequently",
        value: user.uploadHighFrequencyPowerUsage,
        type: 'switch',
        icon: <IconButton name="ios-cloud" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkPurple.hex}}/>,
        callback: (newValue) => { store.dispatch({type: 'USER_UPDATE', data: {uploadHighFrequencyPowerUsage: newValue}}); }
      });
      if (user.uploadHighFrequencyPowerUsage) {
        items.push({
          label: 'The power usage data collected by the app will be sent to the cloud every ' + CLOUD_BATCH_UPDATE_INTERVAL + ' seconds. This might drain your battery faster and is generally used for hubs.',
          type: 'explanation',
          below: true,
        });
      }
      else {
        items.push({
          label: 'The power usage data collected by the app will be sent to the cloud during sync every ' + Math.round(SYNC_INTERVAL/60) + ' minutes.' +
          '\n\nIf Upload frequently is enabled, it will upload every ' + CLOUD_BATCH_UPDATE_INTERVAL + ' seconds. This might drain your battery faster and is generally used for hubs.',
          type: 'explanation',
          below: true,
        });
      }

    }
    else {
      items.push({
        label: 'If sharing power usage is enabled, all updates in power usage gathered by the app will be sent to the cloud.',
        type: 'explanation',
        below: true,
      });
    }


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
              Alert.alert("Whoops!", "We could not remove your phone details from the Cloud. Please try again later.", [{text:'OK'}]);
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

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    return (
      <Background image={this.props.backgrounds.menu} >
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
