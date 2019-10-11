import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsPrivacy", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView,
  Linking} from 'react-native';

import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {colors, } from '../styles'
import { Util } from "../../util/Util";
import {CLOUD} from "../../cloud/cloudAPI";
import {CLOUD_BATCH_UPDATE_INTERVAL, SYNC_INTERVAL} from "../../ExternalConfig";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
// import { NotificationHandler } from "../../notifications/NotificationHandler";


export class SettingsPrivacy extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Privacy")});
  }

  unsubscribe : any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
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
    const store = core.store;
    let state = store.getState();
    let items = [];


    items.push({
      label: lang("You_can_choose_what_you_w"),
      type: 'largeExplanation',
      style:{paddingTop:15, paddingBottom:15}
    });

    items.push({
      label: lang("Share_location"),
      value: user.uploadLocation,
      type: 'switch',
      icon: <IconButton name="ios-pin" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadLocation: newValue} });
    }});

    items.push({
      label: lang("Show_the_other_people_in_"),
      type: 'explanation',
      below: true
    });

    items.push({
      label: lang("Share_switch_state"),
      value: user.uploadSwitchState,
      type: 'switch',
      icon: <IconButton name="md-power" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
      callback:(newValue) => {
        store.dispatch({ type: 'USER_UPDATE', data: {uploadSwitchState: newValue} });
    }});
    items.push({
      label: lang("Show_the_other_people_in_y"),
      type: 'explanation',
      below: true
    });

    items.push({
      label: lang("Share_phone_type_details"),
      value: user.uploadDeviceDetails,
      type: 'switch',
      icon: <IconButton name="ios-phone-portrait" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.darkPurple.hex}} />,
      callback:(newValue) => {
        if (newValue === false) {
          let deviceId = Util.data.getCurrentDeviceId(state);
          core.eventBus.emit("showLoading", "Removing phone details from the Cloud...");
          CLOUD.updateDevice(deviceId, {
            os: null,
            userAgent: null,
            model: null,
          })
            .then(() => {
              core.eventBus.emit("showLoading", "Done!");
              setTimeout(() => {
                core.eventBus.emit("hideLoading");
                store.dispatch({ type: 'USER_UPDATE', data: {uploadDeviceDetails: newValue} });
                store.dispatch({ type: 'CLEAR_DEVICE_DETAILS', deviceId: deviceId, data: {
                  os: null,
                  userAgent: null,
                  model: null,
                }});
                Alert.alert(
lang("_Phone_Details_Removed__W_header"),
lang("_Phone_Details_Removed__W_body"),
[{text:lang("_Phone_Details_Removed__W_left")}]);
              }, 500);
            })
            .catch((err) => {
              core.eventBus.emit("hideLoading");
              Alert.alert(
lang("_Whoops___We_could_not_re_header"),
lang("_Whoops___We_could_not_re_body"),
[{text:lang("_Whoops___We_could_not_re_left")}]);
            })
        }
        else {
          store.dispatch({ type: 'USER_UPDATE', data: { uploadDeviceDetails: newValue }});
        }
      }});
    items.push({
      label: lang("Help_us_improve_your_expe"),
      type: 'explanation',
      below: true
    });

    items.push({
      label: lang("Privacy_Policy"),
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
    const store = core.store;
    const state = store.getState();
    let user = state.user;

    return (
      <Background image={core.background.menu} >
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
