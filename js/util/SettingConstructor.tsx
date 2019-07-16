
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
import { AlternatingContent } from "../views/components/animated/AlternatingContent";
import { core } from "../core";
import { NavigationUtil } from "./NavigationUtil";
import { LOGe } from "../logging/Log";


const getIcon = function(name : string, size : number, iconColor: string, backgroundColor : string) {
  return <IconButton name={name} buttonSize={40} size={size} color={iconColor} buttonStyle={{backgroundColor:backgroundColor}}/>
};


const getAlternatingIcons = function(names : string[], sizes : number[], iconColors: string[], backgroundColors : string[]) {
  if (Platform.OS === 'android') {
    return (
      <AlternatingContent
        style={{width: 25, height:25, marginLeft:2}}
        fadeDuration={500}
        switchDuration={2000}
        contentArray={[
          getIcon(names[0], sizes[0], iconColors[0], backgroundColors[0]),
          getIcon(names[1], sizes[1], iconColors[1], backgroundColors[1])
        ]}
      />
    );
  }
  else {
    return (
      <AlternatingContent
        style={{width: 30, height:30, backgroundColor: backgroundColors[0], borderRadius: 6}}
        fadeDuration={500}
        switchDuration={2000}
        contentArray={[
          getIcon(names[0], sizes[0], iconColors[0], backgroundColors[0]),
          getIcon(names[1], sizes[1], iconColors[1], backgroundColors[1])
        ]}
      />
    );
  }
};

const insertExplanation = function(items: any[], label : string, below : boolean = false, alreadyPadded : boolean = false) {
  if (Platform.OS === 'ios') {
    items.push({type: 'explanation', label: label, below: below, alreadyPadded: alreadyPadded});
  }
};

export const SettingConstructor = function(store, state, clickCallback = () => {}) {
  let items = [];

  insertExplanation(items, lang("My_AccountLabel"), false);
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
  insertExplanation(items, lang("PrivacyLabel"), true);

  insertExplanation(items,  lang("ConfigurationLabel"), false, true);
  // if (Object.keys(state.spheres).length > 0) {
  //   items.push({
  //     id: 'Mesh Overview',
  //     label: lang("Mesh_Overview"),
  //     type: 'navigation',
  //     style: {color: '#000'},
  //     mediumIcon: getIcon('md-share', 35, colors.white.hex, colors.menuBackground.hex),
  //     callback: () => {
  //       clickCallback();
  //       NavigationUtil.navigate( "SettingsMeshTopology");
  //     }
  //   });
  // }

  items.push({
    id: 'App Settings',
    label: lang("App_Settings"),
    type: 'navigation',
    style: {color: '#000'},
    mediumIcon: getIcon('ios-cog', 35, colors.white.hex, colors.green.hex),
    callback: () => {
      clickCallback();
      NavigationUtil.navigate( "SettingsApp");
    }
  });

  // if (state.app.tapToToggleEnabled !== false) {
  //   let tapToToggleSettings = { tutorial: false };
  //   if (!Util.data.getTapToToggleCalibration(state)) {
  //     tapToToggleSettings.tutorial = true;
  //   }
  //   items.push({
  //     id:'Calibrate Tap-to-Toggle',
  //     label: lang("Calibrate_Tap_to_Toggle"),
  //     type:'button',
  //     style: {color:'#000'},
  //     mediumIcon: getIcon('md-flask', 35, colors.white.hex, colors.menuBackground.hex),
  //     callback: () => { clickCallback(); core.eventBus.emit("CalibrateTapToToggle", tapToToggleSettings); }
  //   });
  // }

  // items.push({
  //   id: 'whats new',
  //   label: lang("androidWhats_new_Whats_ne",Platform.OS),
  //   type: 'button',
  //   style: {color: '#000'},
  //   mediumIcon: getIcon('md-bulb', 31, colors.white.hex, colors.green.hex),
  //   callback: () => { clickCallback(); core.eventBus.emit("showWhatsNew"); }
  // });

  insertExplanation(items,  lang("TROUBLESHOOTING"), false);
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
      // Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      clickCallback();
      NavigationUtil.navigate( "SettingsFAQ");
    }
  });

  if (Platform.OS !== 'android') {
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
      }});
  }


  if (Platform.OS === 'android') {
    items.push({id: 'settingsSpacer', type: 'spacer'})
    items.push({
      id: 'quit',
      label: lang("Force_Quit"),
      icon:  getIcon("md-remove-circle", 32, colors.white.hex, colors.darkRed.hex),
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
