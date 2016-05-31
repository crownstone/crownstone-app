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


export class SettingsOverview extends Component {

  userIsOwner() {
    const store = this.props.store;
    const state = store.getState();
    let groups = Object.keys(state.groups);

    if (groups.length > 0) {
      groups.forEach((groupId) => {
        if (state.groups[groupId].config.ownerKey !== undefined) {
          return true;
        }
      })
    }
    return false;
  }


  userInGroups() {
    const store = this.props.store;
    const state = store.getState();
    return Object.keys(state.groups).length > 0;
  }

  _getItems() {
    let items = [
      {type:'spacer'},
      {label:'Manage Profile',  type:'navigation', callback: () => {Actions.settingsProfile()}}
    ];

    if (this.userInGroups()) {
      items.push({label:'Manage Groups', type:'navigation', callback: () => {Actions.settingsGroups()}});
      items.push({label:'Manage Rooms', type:'navigation', callback: () => {Actions.settingsRooms()}});
    }
    else {
      items.push({label:'Add Group', type:'navigation', callback: () => {Actions.setupAddGroup()}});
    }

    if (this.userIsOwner()) {
      items.push({label:'Manage Crownstones', type:'navigation', callback: () => {Actions.settingsCrownstones()}});
    }

    items.push({type:'spacer'});
    items.push({label:'App Complexity', type:'navigation', callback: () => {Actions.appComplexity()}});
    items.push({type:'spacer'});
    items.push({label:'Log Out', type:'button', callback: () => {this._logoutPopup()}});
    return items;
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: logOut},
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
