import { Languages } from "../Languages"
import * as React from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableHighlight,
  View
} from 'react-native';

import { Util }               from './Util'
import { AppUtil }            from './AppUtil'
import { Actions }            from 'react-native-router-flux';
import { colors }             from '../views/styles'
import { Icon }               from '../views/components/Icon'
import { IconButton }         from '../views/components/IconButton'
import { createNewSphere }    from "./CreateSphere";
import { AlternatingContent } from "../views/components/animated/AlternatingContent";
import { MapProvider }        from "../backgroundProcesses/MapProvider";


const getIcon = function(name : string, size : number, iconColor: string, backgroundColor : string) {
  if (Platform.OS === 'android') {
    return <Icon name={name} size={size} color={colors.menuBackground.rgba(0.75)} style={{backgroundColor:'transparent', padding:0, margin:0}} />
  }
  else {
    return <IconButton name={name} size={size} color={iconColor} buttonStyle={{backgroundColor:backgroundColor}}/>
  }
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

export const SettingConstructor = function(store, state, eventBus, clickCallback = () => {}) {
  let items = [];

  insertExplanation(items, Languages.label("SettingConstructor", "My_AccountLabel")(), false);
  items.push({
    id: 'My Account',
    label: Languages.label("SettingConstructor", "My_Account")(),
    icon: getIcon('ios-body', 23, colors.white.hex, colors.purple.hex),
    type: 'navigation',
    callback: () => {
      clickCallback();
      Actions.settingsProfile();
    }
  });
  items.push({
    id:'Privacy',
    label: Languages.label("SettingConstructor", "Privacy")(),
    icon: getIcon('ios-eye', 27, colors.white.hex, colors.darkPurple.hex),
    type: 'navigation',
    callback:() => {
      clickCallback();
      Actions.settingsPrivacy();
    }
  });
  insertExplanation(items, Languages.label("SettingConstructor", "PrivacyLabel")(), true);

  insertExplanation(items,  Languages.label("SettingConstructor", "ConfigurationLabel")(), false, true);
  if (Object.keys(state.spheres).length > 0) {
    items.push({
      id: 'Mesh Overview',
      label: Languages.label("SettingConstructor", "Mesh_Overview")(),
      type: 'navigation',
      style: {color: '#000'},
      icon: getIcon('md-share', 23, colors.white.hex, colors.menuBackground.hex),
      callback: () => { clickCallback(); Actions.settingsMeshTopology(); }
    });
  }

  items.push({
    id: 'App Settings',
    label: Languages.label("SettingConstructor", "App_Settings")(),
    type: 'navigation',
    style: {color: '#000'},
    icon: getAlternatingIcons(['ios-cog','ios-battery-full'],[25,25],[colors.white.hex, colors.white.hex],[colors.darkBackground.hex, colors.darkBackground.hex]) ,
    callback: () => { clickCallback(); Actions.settingsApp(); }
  });

  if (state.app.tapToToggleEnabled !== false) {
    let tapToToggleSettings = { tutorial: false };
    if (!Util.data.getTapToToggleCalibration(state)) {
      tapToToggleSettings.tutorial = true;
    }
    items.push({
      id:'Calibrate Tap-to-Toggle',
      label: Languages.label("SettingConstructor", "Calibrate_Tap_to_Toggle")(),
      type:'button',
      style: {color:'#000'},
      icon: getIcon('md-flask', 22, colors.white.hex, colors.menuBackground.hex),
      callback: () => { clickCallback(); eventBus.emit("CalibrateTapToToggle", tapToToggleSettings); }
    });
  }

  items.push({
    id: 'whats new',
    label: Languages.label("SettingConstructor", "androidWhats_new_Whats_ne")(Platform.OS),
    type: 'button',
    style: {color: '#000'},
    icon: getIcon('md-bulb', 23, colors.white.hex, colors.green.hex),
    callback: () => { clickCallback(); eventBus.emit("showWhatsNew"); }
  });

  insertExplanation(items,  Languages.label("SettingConstructor", "TROUBLESHOOTING")(), false);
  items.push({
    id:'Diagnostics',
    label: Languages.label("SettingConstructor", "Diagnostics")(),
    type:'navigation',
    icon: getIcon('md-analytics', 21, colors.white.hex, colors.csBlue.hex),
    callback: () => {
      clickCallback();
      Actions.settingsDiagnostics()
    }
  });
  items.push({
    id:'Help',
    label: Languages.label("SettingConstructor", "Help")(),
    type:'navigation',
    icon: getIcon('ios-help-circle', 23, colors.white.hex, colors.csBlueLight.hex),
    callback: () => {
      // Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      clickCallback();
      Actions.settingsFAQ()
    }
  });

  if (Platform.OS !== 'android') {
    items.push({id: 'settingsSpacer', type: 'spacer'})
  }

  items.push({
    id:'Log Out',
    label: Languages.label("SettingConstructor", "Log_Out")(),
    type:'button',
    icon: getIcon('md-log-out', 22, colors.white.hex, colors.menuRed.hex),
    callback: () => {
      Alert.alert(
        Languages.alert("SettingConstructor", "_Log_out__Are_you_sure__I_header")(),
        Languages.alert("SettingConstructor", "_Log_out__Are_you_sure__I_body")(),
        [
          {text: Languages.alert("SettingConstructor", "_Log_out__Are_you_sure__I_left")(), style: 'cancel'},
          {text: Languages.alert("SettingConstructor", "_Log_out__Are_you_sure__I_right")(), onPress: () => { AppUtil.logOut(store); }}
        ])
      }});



  return items;
};
