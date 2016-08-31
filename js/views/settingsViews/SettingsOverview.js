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
import { IconButton } from '../components/IconButton'
import { NativeEventsBridge } from '../../native/NativeEventsBridge'
import { userInGroups, userIsAdmin, getGroupName } from '../../util/dataUtil'


export class SettingsOverview extends Component {

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let items = [];
    items.push({type:'explanation', label:'DEBUG: Disable the localization updates', bottom:'false'});
    items.push({type:'switch', label: 'Enable Localization', value: state.app.enableLocalization,
        callback: (newValue) => {
          store.dispatch({
            type: 'UPDATE_APP_STATE',
            data: {enableLocalization:newValue}
          })
          NativeEventsBridge.stopListeningToLocationEvents();
          if (newValue === true) {
            NativeEventsBridge.startListeningToLocationEvents();
          }
          this.forceUpdate();
        }
      })

    items.push({type:'explanation', label:'UPDATE YOUR PROFILE', bottom:'false'});
    items.push({label:'My Profile', icon: <IconButton name="ios-body" size={23} button={true} color="#fff" buttonStyle={{backgroundColor:colors.purple.hex}} />, type:'navigation', callback: () => {Actions.settingsProfile()}});

    items.push({type:'explanation', label:'CONFIGURATION', bottom:'false'});
    if (userInGroups(state)) {
      items.push({label:'Groups', icon: <IconButton name="c1-house" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, type:'navigation', callback: () => {
        Actions.settingsGroupOverview()
      }});
    }
    else {
      items.push({label:'Add Group', icon: <IconButton name="c1-house" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, type:'navigation', callback: () => {
        Actions.setupAddGroup()
      }});
    }

    if (userIsAdmin(state)) {
      items.push({label:'Rooms', icon: <IconButton name="c1-foodWine" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />, type:'navigation', callback: () => {
        Actions.settingsRoomOverview();
      }});

      items.push({label:'Crownstones', icon: <IconButton name="ios-flash" size={25} button={true} color="#fff" buttonStyle={{backgroundColor:colors.menuTextSelected.hex}} />, type:'navigation', callback: () => {
        Actions.settingsCrownstoneOverview();
      }});
    }
    else {
      items.push({label:'Crownstone Recovery', icon: <IconButton name="ios-flash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.menuTextSelected.hex}} />, type:'navigation', callback: () => {
        Actions.settingsCrownstoneOverview();
      }});
    }

    items.push({type:'spacer'});
    // items.push({label:'App Complexity', type:'navigation', callback: () => {Actions.appComplexity()}});
    // items.push({type:'spacer'});
    items.push({label:'Log Out', type:'button', icon: <IconButton name="md-log-out" size={22} button={true} style={{position:'relative', top:1}} color="#fff" buttonStyle={{backgroundColor:colors.menuRed.hex}} />, callback: () => {this._logoutPopup()}});
    return items;
  }

  _logoutPopup() {
    Alert.alert('Log out','Are you sure?',[
      {text: 'Cancel', style: 'cancel'},
      {text: 'OK', onPress: () => {logOut(this.props.eventBus)}}
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
