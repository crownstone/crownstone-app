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
import { userInGroups, userIsAdmin, getGroupName } from '../../util/dataUtil'


export class SettingsOverview extends Component {

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let activeGroup = state.app.activeGroup || Object.keys(state.groups)[0];
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

    if (userInGroups(state)) {
      items.push({label:'Manage Groups', type:'navigation', callback: () => {
        Actions.settingsGroupOverview()
      }});
    }
    else {
      items.push({label:'Add Group', type:'navigation', callback: () => {
        Actions.setupAddGroup()
      }});
    }

    // TODO: room management
    
    if (userIsAdmin(state)) {
      items.push({label:'Manage Crownstones', type:'navigation', callback: () => {
        Actions.settingsCrownstoneOverview();
      }});
    }
    else {
      items.push({label:'Crownstone Recovery', type:'navigation', callback: () => {
        Actions.settingsCrownstoneOverview();
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
      {text: 'OK', onPress: logOut}
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
