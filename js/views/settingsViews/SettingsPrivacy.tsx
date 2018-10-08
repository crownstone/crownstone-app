import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Linking,
  Switch,
  Text,
  View
} from 'react-native';

import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {colors, OrangeLine} from '../styles'
import { Util } from "../../util/Util";
import {CLOUD} from "../../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL, SYNC_INTERVAL} from "../../ExternalConfig";
// import { NotificationHandler } from "../../notifications/NotificationHandler";


export class SettingsPrivacy extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: Languages.title("SettingsPrivacy", "Privacy")()}
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
      label: Languages.label("SettingsPrivacy", "You_can_choose_what_you_w")(),
      type: 'largeExplanation',
      style:{paddingTop:15, paddingBottom:15}
    });

    items.push({
      label: Languages.label("SettingsPrivacy", "Share_location")(),
      value: user.uploadLocation,
      type: 'switch',
      icon: <IconButton name="ios-pin" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadLocation: newValue} });
    }});

    items.push({
      label: Languages.label("SettingsPrivacy", "Show_the_other_people_in_")(),
      type: 'explanation',
      below: true
    });

    items.push({
      label: Languages.label("SettingsPrivacy", "Share_switch_state")(),
      value: user.uploadSwitchState,
      type: 'switch',
      icon: <IconButton name="md-power" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadSwitchState: newValue} });
    }});
    items.push({
      label: Languages.label("SettingsPrivacy", "Show_the_other_people_in_y")(),
      type: 'explanation',
      below: true
    });
    items.push({
      label: Languages.label("SettingsPrivacy", "Share_diagnostics")(),
      value: user.uploadDiagnostics,
      type: 'switch',
      icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkBackground.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadDiagnostics: newValue} });
    }});
    items.push({
      label: Languages.label("SettingsPrivacy", "Help_us_gather_statistics")(),
      type: 'explanation',
      below: true
    });

    items.push({
      label: Languages.label("SettingsPrivacy", "Share_acitvity_logs")(),
      value: user.uploadActivityLogs,
      type: 'switch',
      icon: <IconButton name="md-calendar" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.csBlue.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadActivityLogs: newValue} });
      }});
    items.push({
      label: Languages.label("SettingsPrivacy", "Activity_logs_are_used_to")(),
      type: 'explanation',
      below: true
    });
    items.push({
      label: Languages.label("SettingsPrivacy", "Share_power_usage")(),
      value: user.uploadPowerUsage,
      type: 'switch',
      icon: <IconButton name="ios-flash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.purple.hex}}/>,
      callback: (newValue) => { store.dispatch({type: 'USER_UPDATE', data: {uploadPowerUsage: newValue}}); }
    });
    if (user.uploadPowerUsage) {
      items.push({
        label: Languages.label("SettingsPrivacy", "Upload_frequently")(),
        value: user.uploadHighFrequencyPowerUsage,
        type: 'switch',
        icon: <IconButton name="ios-cloud" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.darkPurple.hex}}/>,
        callback: (newValue) => { store.dispatch({type: 'USER_UPDATE', data: {uploadHighFrequencyPowerUsage: newValue}}); }
      });
      if (user.uploadHighFrequencyPowerUsage) {
        items.push({
          label: Languages.label("SettingsPrivacy", "The_power_usage_data_coll")(CLOUD_BATCH_UPDATE_INTERVAL),
          type: 'explanation',
          below: true,
        });
      }
      else {
        items.push({
          label: Languages.label("SettingsPrivacy", "The_power_usage_data_colle")(Math.round(SYNC_INTERVAL/60),CLOUD_BATCH_UPDATE_INTERVAL),
          type: 'explanation',
          below: true,
        });
      }

    }
    else {
      items.push({
        label: Languages.label("SettingsPrivacy", "If_sharing_power_usage_is")(),
        type: 'explanation',
        below: true,
      });
    }


    items.push({
      label: Languages.label("SettingsPrivacy", "Share_phone_type_details")(),
      value: user.uploadDeviceDetails,
      type: 'switch',
      icon: <IconButton name="ios-phone-portrait" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.darkPurple.hex}} />,
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
                Alert.alert(
Languages.alert("SettingsPrivacy", "_Phone_Details_Removed__W_header")(),
Languages.alert("SettingsPrivacy", "_Phone_Details_Removed__W_body")(),
[{text:Languages.alert("SettingsPrivacy", "_Phone_Details_Removed__W_left")()}]);
              }, 500);
            })
            .catch((err) => {
              this.props.eventBus.emit("hideLoading");
              Alert.alert(
Languages.alert("SettingsPrivacy", "_Whoops___We_could_not_re_header")(),
Languages.alert("SettingsPrivacy", "_Whoops___We_could_not_re_body")(),
[{text:Languages.alert("SettingsPrivacy", "_Whoops___We_could_not_re_left")()}]);
            })
        }
        else {
          store.dispatch({ type: 'USER_UPDATE', data: { uploadDeviceDetails: newValue }});
        }
      }});
    items.push({
      label: Languages.label("SettingsPrivacy", "Help_us_improve_your_expe")(),
      type: 'explanation',
      below: true
    });

    items.push({
      label: Languages.label("SettingsPrivacy", "Privacy_Policy")(),
      type:'navigation',
      icon: <IconButton name={'ios-cloudy'} size={22} color={colors.white.hex} buttonStyle={{backgroundColor: colors.green.hex }}/>,
      callback: () => {
        Linking.openURL('https://crownstone.rocks/privacy-policy').catch(err => {});
      }
    });
    items.push({
      type: 'spacer',
    });

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
