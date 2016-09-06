import React, { Component } from 'react'
import {
  Alert,
  Dimensions,
  Linking,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { logOut } from './../../util/util'
import { getTotalAmountOfCrownstones } from './../../util/dataUtil'
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
    let totalAmountOfCrownstones = getTotalAmountOfCrownstones(state);

    if (totalAmountOfCrownstones > 0) {
      items.push({type: 'explanation', label: 'USE LOCALIZATION', below: false});
      items.push({
        type: 'switch', label: 'Enable Localization', value: state.app.enableLocalization,
        callback: (newValue) => {
          store.dispatch({
            type: 'UPDATE_APP_STATE',
            data: {enableLocalization: newValue}
          })
          NativeEventsBridge.stopListeningToLocationEvents();
          if (newValue === true) {
            NativeEventsBridge.startListeningToLocationEvents();
          }
          this.forceUpdate();
        }
      });
    }

    items.push({type:'explanation', label:'UPDATE YOUR PROFILE', below:false});
    items.push({label:'My Profile', icon: <IconButton name="ios-body" size={23} button={true} color="#fff" buttonStyle={{backgroundColor:colors.purple.hex}} />, type:'navigation', callback: () => {Actions.settingsProfile()}});

    items.push({type:'explanation', label:'CONFIGURATION', below:false});
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

    if (state.app.activeGroup && Object.keys(state.groups[state.app.activeGroup].stones).length > 0) {
      items.push({type: 'spacer'});
      items.push({
        type: 'button',
        label: 'Turn all Crownstones on',
        icon: <IconButton name="ios-power" size={22} button={true} style={{position: 'relative', top: 1}} color="#fff"
                          buttonStyle={{backgroundColor: colors.menuTextSelected.hex}}/>,
        style: {color: colors.menuTextSelected.hex},
        callback: () => {
          Alert.alert("Are you sure?", "Are you sure you want to turn on every Crownstone in this Group?", [
            {text: 'Cancel', style: 'cancel'},
            {text: 'OK', onPress: () => {}}
          ])
        }
      });
    }

    items.push({type:'spacer'});
    items.push({label:'Log Out', type:'button', icon: <IconButton name="md-log-out" size={22} button={true} style={{position:'relative', top:1}} color="#fff" buttonStyle={{backgroundColor:colors.menuRed.hex}} />, callback: () => {this._logoutPopup()}});

    items.push({type:'spacer'});
    items.push({
      type: 'explanation',
      __item: (
        <View style={{backgroundColor:'transparent'}}>
          <View style={{flexDirection:'row', padding:6, paddingRight:15, paddingLeft: 15, paddingBottom:12, justifyContent:'center'}}>
            <Text style={{fontSize:12, color:'#444'}}>Crownstone </Text>
            <TouchableHighlight onPress={() => {
              Linking.openURL('http://crownstone.rocks/terms-of-service/').catch(err => {})
            }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>terms </Text>
            </TouchableHighlight>
            <Text style={{fontSize:12, color:'#444'}}>& </Text>
            <TouchableHighlight onPress={() => {
              Linking.openURL('http://crownstone.rocks/privacy-policy/').catch(err => {})
            }}>
              <Text style={{fontSize:12, color:colors.blue.hex}}>privacy policy</Text>
            </TouchableHighlight>
          </View>
        </View>
      )
    });

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
