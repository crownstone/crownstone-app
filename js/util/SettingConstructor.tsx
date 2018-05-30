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

export const SettingConstructor = function(store, state, eventBus) {
  let items = [];

  insertExplanation(items, 'MY PROFILE', false);
  items.push({
    id: 'My Account',
    label: 'My Account',
    icon: getIcon('ios-body', 23, colors.white.hex, colors.purple.hex),
    type: 'navigation',
    callback: () => {
      Actions.settingsProfile()
    }
  });
  items.push({
    id:'Privacy',
    label:'Privacy',
    icon: getIcon('ios-eye', 27, colors.white.hex, colors.darkPurple.hex),
    type: 'navigation',
    callback:() => { Actions.settingsPrivacy(); }
  });
  insertExplanation(items, 'You are in control of which data is shared with the cloud.', true);

  insertExplanation(items, 'CONFIGURATION', false, true);
  if (Object.keys(state.spheres).length > 0) {
    items.push({
      id: 'Spheres',
      label: 'Spheres',
      icon: getIcon('c1-sphere', 21.5, colors.white.hex, colors.blue.hex),
      type: 'navigation',
      callback: () => { Actions.settingsSphereOverview() }
    });
  }
  else {
    items.push({
      id: 'Add Sphere',
      label: 'Add Sphere',
      icon: getIcon('ios-home', 22, colors.white.hex, colors.blue.hex),
      type: 'navigation',
      callback: () => {
        createNewSphere(eventBus, store, state.user.firstName+"'s Sphere").catch(() => {});
      }
    });
  }

  if (Object.keys(state.spheres).length > 0 && MapProvider.meshEnabled) {
    items.push({
      id: 'Mesh Overview',
      label: 'Mesh Overview',
      type: 'navigation',
      style: {color: '#000'},
      icon: getIcon('md-share', 23, colors.white.hex, colors.menuBackground.hex),
      callback: () => { Actions.settingsMeshTopology(); }
    });
  }

  items.push({
    id: 'App Settings',
    label: 'App Settings',
    type: 'navigation',
    style: {color: '#000'},
    icon: getAlternatingIcons(['ios-cog','ios-battery-full'],[25,25],[colors.white.hex, colors.white.hex],[colors.darkBackground.hex, colors.darkBackground.hex]) ,
    callback: () => { Actions.settingsApp(); }
  });

  if (state.app.tapToToggleEnabled !== false) {
    let tapToToggleSettings = { tutorial: false };
    if (!Util.data.getTapToToggleCalibration(state)) {
      tapToToggleSettings.tutorial = true;
    }
    items.push({
      id:'Calibrate Tap-to-Toggle',
      label:'Calibrate Tap-to-Toggle',
      type:'button',
      style: {color:'#000'},
      icon: getIcon('md-flask', 22, colors.white.hex, colors.menuBackground.hex),
      callback: () => { eventBus.emit("CalibrateTapToToggle", tapToToggleSettings); }
    });
  }

  items.push({
    id: 'whats new',
    label: Platform.OS === 'android' ? "What's new?" : "What's new in this version?",
    type: 'button',
    style: {color: '#000'},
    icon: getIcon('md-bulb', 23, colors.white.hex, colors.green.hex),
    callback: () => { eventBus.emit("showWhatsNew"); }
  });

  insertExplanation(items, 'TROUBLESHOOTING', false);
  items.push({
    id:'Help',
    label:'Help',
    type:'navigation',
    icon: getIcon('md-help-circle', 22, colors.white.hex, colors.csBlue.hex),
    callback: () => {
      // Linking.openURL('https://crownstone.rocks/app-help/').catch(err => {});
      Actions.settingsFAQ()
    }
  });

  if (Platform.OS !== 'android') {
    items.push({id: 'settingsSpacer', type: 'spacer'})
  }

  items.push({
    id:'Log Out',
    label:'Log Out',
    type:'button',
    icon: getIcon('md-log-out', 22, colors.white.hex, colors.menuRed.hex),
    callback: () => {
      Alert.alert('Log out','Are you sure? I will tidy up and close the app. Next time you open it you can log in again!',[
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => { AppUtil.logOut(store); }}
      ])
    }});



  return items;
};
