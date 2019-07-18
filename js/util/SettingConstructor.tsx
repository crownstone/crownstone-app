
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingConstructor", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Platform} from 'react-native';

import { AppUtil }            from './AppUtil'
import { colors }             from '../views/styles'
import { IconButton }         from '../views/components/IconButton'
import { NavigationUtil } from "./NavigationUtil";
import { LOGe } from "../logging/Log";


const getIcon = function(name : string, size : number, iconColor: string, backgroundColor : string) {
  return <IconButton name={name} buttonSize={40} size={size} color={iconColor} buttonStyle={{backgroundColor:backgroundColor}}/>
};

export const SettingConstructor = function(store, state, clickCallback = () => {}) {
  let items = [];

  items.push({type: 'explanation', label: lang("My_AccountLabel")});
  items.push({
    id: 'My Account',
    label: lang("My_Account"),
    mediumIcon: getIcon('ios-body', 30, colors.white.hex, colors.purple.hex),
    type: 'navigation',
    callback: () => {
      clickCallback();
      NavigationUtil.navigate( "SettingsProfile");
    }
  });
  items.push({
    id:'Privacy',
    label: lang("Privacy"),
    mediumIcon: getIcon('ios-eye', 32, colors.white.hex, colors.darkPurple.hex),
    type: 'navigation',
    callback:() => {
      clickCallback();
      NavigationUtil.navigate( "SettingsPrivacy");
    }
  });
  items.push({type: 'explanation', label: lang("PrivacyLabel"), below: true});

  items.push({type: 'explanation', label: lang("ConfigurationLabel"), below: false, alreadyPadded: true});
  items.push({
    id: 'App Settings',
    label: lang("App_Settings"),
    type: 'navigation',
    mediumIcon: getIcon('ios-cog', 35, colors.white.hex, colors.green.hex),
    callback: () => {
      clickCallback();
      NavigationUtil.navigate( "SettingsApp");
    }
  });

  items.push({type: 'explanation', label: lang("TROUBLESHOOTING")});
  items.push({
    id:'Diagnostics',
    label: lang("Diagnostics"),
    type:'navigation',
    mediumIcon: getIcon('md-analytics', 28, colors.white.hex, colors.csBlue.hex),
    callback: () => {
      clickCallback();
      NavigationUtil.navigate( "SettingsDiagnostics");
    }
  });
  items.push({
    id:'Help',
    label: lang("Help"),
    type:'navigation',
    mediumIcon: getIcon('ios-help-circle', 30, colors.white.hex, colors.csBlueLight.hex),
    callback: () => {
      clickCallback();
      NavigationUtil.navigate( "SettingsFAQ");
    }
  });

  items.push({id: 'settingsSpacer', type: 'spacer'})
  items.push({
    id:'Log Out',
    label: lang("Log_Out"),
    type:'button',
    mediumIcon: getIcon('md-log-out', 32, colors.white.hex, colors.menuRed.hex),
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
      mediumIcon:  getIcon("md-remove-circle", 28, colors.white.hex, colors.darkRed.hex),
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

  return items;
};
