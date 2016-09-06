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

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'

export class SettingsGroupOverview extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
        this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getGroups(state, accessLevel) {
    let items = [];
    for (let groupId in state.groups) {
      if (state.groups.hasOwnProperty(groupId)) {
        let group = state.groups[groupId];
        if (group.users[state.user.userId].accessLevel === accessLevel) {
          items.push({
            label: group.config.name,
            type:'navigation',
            callback: () => {
              Actions.settingsGroup({groupId:groupId, title: group.config.name})
            }
          });
        }
      }
    }

    return items;
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let adminGroups = this._getGroups(state, 'admin');
    let memberGroups = this._getGroups(state, 'member');
    let guestGroups = this._getGroups(state, 'guest');

    if (adminGroups.length > 0) {
      items.push({label:'GROUPS WHERE YOU ARE AN ADMIN',  type:'explanation', below:false});
      items = items.concat(adminGroups);
    }

    if (memberGroups.length > 0) {
      items.push({label:'GROUPS WHERE YOU ARE A MEMBER',  type:'explanation', below:false});
      items = items.concat(memberGroups);
    }

    if (guestGroups.length > 0) {
      items.push({label:'GROUPS WHERE YOU ARE A GUEST',  type:'explanation', below:false});
      items = items.concat(guestGroups);
    }

    items.push({type:'spacer'});
    items.push({
      label: 'Create a new Group',
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        Alert.alert(
          "Do you want to create a new Group?",
          "Select yes if you want to setup your own Crownstones.",
          [
            {text:'No'},
            {text:'Yes', onPress:() => {Actions.setupAddGroup();}}
          ]
        );
      }
    });

    // if you do not have, or are part of, any groups yet.
    if (adminGroups.length == 0 && memberGroups.length == 0 && guestGroups.length == 0)
      items.push({label:'Having your own Group is only required if you want to add your own Crownstones.',  type:'explanation', below: true});


    return items;
  }

  render() {

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
