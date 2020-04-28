import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Linking,
  TouchableHighlight,
  ScrollView,
  Text,
  View, Alert, Platform
} from "react-native";

import { ListEditableItems } from '../components/ListEditableItems'
import {styles, colors, } from '../styles'

import DeviceInfo from 'react-native-device-info';
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { getDevAppItems } from "./SettingsDeveloper";
import { NavigationUtil } from "../../util/NavigationUtil";
import { AppUtil } from "../../util/AppUtil";
import { LOGe } from "../../logging/Log";
import { IconButton } from "../components/IconButton";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";

export class SettingsOverview extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Settings")});
  }

  unsubscribe : any;

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeUserData || change.changeSpheres || change.changeStones || change.changeAppSettings || change.changeUserDeveloperStatus) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    const store = core.store;
    const state = store.getState();
    let items = [];


    items.push({type: 'explanation', label: lang("My_AccountLabel")});
    items.push({
      id: 'My Account',
      label: lang("My_Account"),
      mediumIcon: <IconButton name={'ios-body'} buttonSize={40} size={30} color={colors.white.hex} buttonStyle={{backgroundColor:colors.purple.hex}}/>,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "SettingsProfile");
      }
    });
    items.push({
      id:'Privacy',
      label: lang("Privacy"),
      mediumIcon: <IconButton name={'ios-eye'} buttonSize={40} size={32} color={colors.white.hex} buttonStyle={{backgroundColor:colors.darkPurple.hex}}/>,
      type: 'navigation',
      callback:() => {
        NavigationUtil.navigate( "SettingsPrivacy");
      }
    });
    items.push({type: 'explanation', label: lang("PrivacyLabel"), below: true});

    items.push({type: 'explanation', label: lang("ConfigurationLabel"), below: false, alreadyPadded: true});
    items.push({
      id: 'App Settings',
      label: lang("App_Settings"),
      type: 'navigation',
      mediumIcon: <IconButton name={'ios-cog'} buttonSize={40} size={35} color={colors.white.hex} buttonStyle={{backgroundColor:colors.green.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SettingsApp");
      }
    });

    items.push({type: 'explanation', label: lang("TROUBLESHOOTING")});
    items.push({
      id:'Diagnostics',
      label: lang("Diagnostics"),
      type:'navigation',
      mediumIcon: <IconButton name={'md-analytics'} buttonSize={40} size={28} color={colors.white.hex} buttonStyle={{backgroundColor:colors.csBlue.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SettingsDiagnostics");
      }
    });
    items.push({
      id:'Help',
      label: lang("Help"),
      type:'navigation',
      mediumIcon: <IconButton name={'ios-help-circle'} buttonSize={40} size={30} color={colors.white.hex} buttonStyle={{backgroundColor:colors.csBlueLight.hex}}/>,
      callback: () => {
        NavigationUtil.navigate( "SettingsFAQ");
      }
    });

    items.push({id: 'settingsSpacer', type: 'spacer'})
    items.push({
      id:'Log Out',
      label: lang("Log_Out"),
      type:'button',
      mediumIcon: <IconButton name={'md-log-out'} buttonSize={40} size={32} color={colors.white.hex} buttonStyle={{backgroundColor:colors.menuRed.hex}}/>,
      callback: () => {
        Alert.alert(
          lang("_Log_out__Are_you_sure__I_header"),
          lang("_Log_out__Are_you_sure__I_body"),
          [
            {text: lang("_Log_out__Are_you_sure__I_left"), style: 'cancel'},
            {text: lang("_Log_out__Are_you_sure__I_right"), onPress: () => { AppUtil.logOut(store); }}
          ])
      }
    });


    if (Platform.OS === 'android') {
      items.push({
        id: 'quit',
        type:'button',
        label: lang("Force_Quit"),
        mediumIcon:  <IconButton name={'md-remove-circle'} buttonSize={40} size={28} color={colors.white.hex} buttonStyle={{backgroundColor:colors.darkRed.hex}}/>,
        callback: () => {
          Alert.alert(
            lang("_Are_you_sure___Crownston_header"),
            lang("_Are_you_sure___Crownston_body"),
            [{text: lang("_Are_you_sure___Crownston_left"), style: 'cancel'},
              {
                text: lang("_Are_you_sure___Crownston_right"), onPress: () => {
                  try {
                    AppUtil.quit();
                  }
                  catch(err) {
                    LOGe.info("Failed to quit.", err);
                  }
                }}
            ])
        }
      });
    }

    if (state.development.devAppVisible && state.user.developer) {
      items = [...items, ...getDevAppItems()];
    }
    else {
      items.push({type:'spacer'});
    }


    items.push({type:'explanation',
      __item: (
        <View style={{flex:1}} />
      )});
    items.push({
      type: 'explanation',
      __item: (
        <View style={{backgroundColor:'transparent'}}>
          <View style={{flexDirection:'row', padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12, justifyContent:'center'}}>
            <Text style={{fontSize:12, color:'#444'}}>{ lang("Crownstone_") }</Text>
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/terms-of-service/').catch(err => {})}}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>{ lang("terms_") }</Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>{ lang("__") }</Text>
            <TouchableHighlight onPress={() => { Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {}) }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>{ lang("privacy_policy") }</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu}>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
          <Text style={[styles.version,{paddingBottom: 20}]}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
