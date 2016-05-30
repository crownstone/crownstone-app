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
  _getItems() {
    return [
      {type:'spacer'},
      {label:'Manage Profile',  type:'navigation',   callback: () => {Actions.settingsProfile()}},
      {label:'Manage my Group',    type:'navigation',   callback: () => {Actions.settingsGroups()}},
      {label:'Manage my Rooms',   type:'navigation',      callback: () => {Actions.settingsRooms()}},
      {label:'Manage my Crownstones', type:'navigation',  callback: () => {Actions.settingsCrownstones()}},
      {label:'App Complexity',     type:'navigation',      callback: () => {Actions.appComplexity()}},
      {type:'spacer'},
      {label:'Log Out',  type:'button', callback: () => {this._logoutPopup()}},
    ]
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: () => logOut()},
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
