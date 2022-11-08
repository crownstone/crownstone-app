import {LiveComponent} from "../LiveComponent";

import {Languages} from "../../Languages"
import * as React from 'react';
import {Alert, Linking, Platform, ScrollView, Text, TouchableHighlight, View} from "react-native";

import {ListEditableItems} from '../components/ListEditableItems'
import { background, colors, screenWidth, styles, tabBarHeight, viewPaddingTop } from "../styles";

import {core} from "../../Core";
import {TopBarUtil} from "../../util/TopBarUtil";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {AppUtil} from "../../util/AppUtil";
import {LOGe} from "../../logging/Log";
import {getDevAppItems} from "./dev/SettingsDeveloper";
import {Icon} from "../components/Icon";
import {SettingsNavbarBackground} from "../components/SettingsBackground";
import { DataUtil } from "../../util/DataUtil";
import { SettingsScrollbar } from "../components/SettingsScrollbar";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsOverview", key)(a,b,c,d,e);
}

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
      testID: 'myAccount',
      icon: <Icon name={'ios-body'} size={30} color={colors.purple.hex} />,
      type: 'navigation',
      callback: () => {
        NavigationUtil.navigate( "SettingsProfile");
      }
    });
    items.push({
      id:'Privacy',
      label: lang("Privacy"),
      testID: 'privacy',
      icon: <Icon name={'ios-eye'} size={32} color={colors.darkPurple.hex} />,
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
      testID: 'appSettings',
      icon: <Icon name={'ios-cog'} size={30} color={colors.green.hex} />,
      callback: () => {
        NavigationUtil.navigate( "SettingsApp");
      }
    });

    items.push({type: 'explanation', label: lang("TROUBLESHOOTING")});
    items.push({
      id:'Diagnostics',
      label: lang("Diagnostics"),
      type:'navigation',
      testID: 'diagnostics',
      icon: <Icon name={'ma-sync-problem'} size={28} color={colors.csBlue.hex} />,
      callback: () => {
        NavigationUtil.navigate( "SettingsDiagnostics");
      }
    });
    items.push({
      id:'Help',
      label: lang("Help"),
      type:'navigation',
      testID:'help',
      icon: <Icon name={'ion5-md-help-circle-outline'} size={30} color={colors.csBlueLight.hex} />,
      callback: () => {
        NavigationUtil.navigate( "SettingsFAQ");
      }
    });

    items.push({id: 'settingsSpacer', type: 'spacer'})
    items.push({
      id:'Log Out',
      label: lang("Log_Out"),
      type:'button',
      testID:'logOut',
      icon: <Icon name={'md-log-out'} size={28} color={colors.menuRed.hex} />,
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
        testID:'forceQuit',
        color: colors.darkRed.hex,
        icon:  <Icon name={'md-remove-circle'} size={28} color={colors.darkRed.hex} />,
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
                  catch(err : any) {
                    LOGe.info("Failed to quit.", err?.message);
                  }
                }}
            ])
        }
      });
    }

    if (state.development.devAppVisible && DataUtil.isDeveloper()) {
      items = [...items, ...getDevAppItems()];
    }
    else {
      items.push({type:'spacer'});
    }


    items.push({
      type: 'explanation',
      __item: (
        <View style={{backgroundColor:'transparent'}}>
          <View style={{flexDirection:'row', padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12, justifyContent:'center'}}>
            <Text style={{fontSize:12, color:'#444'}}>{ lang("Crownstone_") }</Text>
            <TouchableHighlight testID={'TermsOfService'} onPress={() => { Linking.openURL('https://crownstone.rocks/terms-of-service/').catch(err => {})}}>
              <Text style={{fontSize:12, color:colors.blue3.hex}}>{ lang("terms_") }</Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>{ lang("__") }</Text>
            <TouchableHighlight testID={'PrivacyPolicy'} onPress={() => { Linking.openURL('https://crownstone.rocks/privacy-policy/').catch(err => {}) }}>
              <Text style={{fontSize:12, color:colors.blue3.hex}}>{ lang("privacy_policy") }</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  render() {
    console.log("Drawing SettingsOverview");
    return (
      <SettingsNavbarBackground testID={'SettingsOverview'}>
        <SettingsScrollbar testID={'SettingsOverview_scrollview'}>
          <ListEditableItems items={this._getItems()} />
        </SettingsScrollbar>
      </SettingsNavbarBackground>
    );
  }
}
