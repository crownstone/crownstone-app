import React, { Component } from 'react'
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { logOut } from './../../util/util'
import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { NativeBridge } from '../../native/NativeBridge'


export class SettingsOverview extends Component {

  userIsAdmin() {
    const store = this.props.store;
    const state = store.getState();
    let groups = Object.keys(state.groups);

    for (let i = 0; i < groups.length; i++) {
      if (state.groups[groups[i]].config.adminKey !== undefined) {
        return true;
      }
    }

    return false;
  }


  userInGroups() {
    const store = this.props.store;
    const state = store.getState();
    return Object.keys(state.groups).length > 0;
  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let items = [
      {type:'explanation', label:'Disable the localization updates', bottom:'false'},
      {type:'switch', label: 'Enable Localization', value: state.app.enableLocalization,
        callback: (newValue) => {
          store.dispatch({
            type: 'UPDATE_APP_STATE',
            data: {enableLocalization:newValue}
          })
          NativeBridge.stopListeningToLocationUpdates();
          if (newValue === true) {
            NativeBridge.startListeningToLocationUpdates();
          }
          this.forceUpdate();
        }
      },
      {type:'explanation', label:'App settings', bottom:'false'},
      {label:'Manage Profile',  type:'navigation', callback: () => {Actions.settingsProfile()}}
    ];

    if (this.userInGroups()) {
      items.push({label:'Manage Groups', type:'navigation', callback: () => {
        Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])
        // Actions.settingsGroups()
      }});
    }
    else {
      items.push({label:'Add Group', type:'navigation', callback: () => {
        // Actions.setupAddGroup()
        Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}]);
      }});
    }

    // TODO: room management
    
    if (this.userIsAdmin()) {
      items.push({label:'Manage Crownstones', type:'navigation', callback: () => {
        Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])
        // Actions.settingsCrownstones();
      }});
    }

    items.push({type:'spacer'});
    // items.push({label:'App Complexity', type:'navigation', callback: () => {Actions.appComplexity()}});
    // items.push({type:'spacer'});
    items.push({label:'Log Out', type:'button', callback: () => {this._logoutPopup()}});
    return items;
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: /* logOut */ () => {Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])}},
    ])
  }

  render() {
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
