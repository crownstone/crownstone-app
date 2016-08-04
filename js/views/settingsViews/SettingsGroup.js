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
import { ProfilePicture } from './../components/ProfilePicture'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles';
import { getMyLevelInGroup } from '../../util/dataUtil';
var Icon = require('react-native-vector-icons/Ionicons');

function capitalize(string) {
  return string[0].toUpperCase() + string.substring(1);
}

export class SettingsGroup extends Component {

  _getUsersWithAccess(state,accessLevel) {
    let result = [];
    let users = state.groups[this.props.groupId].users;
    for (let userId in users) {
      if (users.hasOwnProperty(userId)) {
        if (users[userId].accessLevel == accessLevel) {
          result.push({
            label:users[userId].firstName + " " + users[userId].lastName,
            type: userId === state.user.userId ? 'info' : 'navigation',
            icon: <ProfilePicture picture={users[userId].picture} />,
            callback: () => {}
          })
        }
      }
    }

    let level = getMyLevelInGroup(state, this.props.groupId);
    if (level == "admin" || level == 'member' && accessLevel == 'guest') {
      if (accessLevel !== 'admin') { // currently we do not support multiple admins.
        result.push({
          label: 'Invite a new ' + capitalize(accessLevel), // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
          type: 'navigation',
          icon: <Icon name="ios-add-circle" size={30} color={colors.green.hex}/>,
          callback: () => {
            Actions.settingsInvite({title: 'Invite ' + capitalize(accessLevel)});
          }
        });
      }
    }

    return result
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    items.push({label:'ADMINS:',  type:'explanation', below:false});
    items = items.concat(this._getUsersWithAccess(state,'admin'));
    items.push({label:'Admins can add, configure and remove Crownstones and Rooms.', style:{paddingBottom:0}, type:'explanation', below:true});

    items.push({label:'MEMBERS:',  type:'explanation', below:false});
    items = items.concat(this._getUsersWithAccess(state,'member'));
    items.push({label:'Members can configure Crownstones.', style:{paddingBottom:0}, type:'explanation', below:true});

    items.push({label:'GUESTS:',  type:'explanation', below:false});
    items = items.concat(this._getUsersWithAccess(state,'guest'));
    items.push({label:'Guests can control Crownstones and devices will remain on if they are the last one in the room.', style:{paddingBottom:0}, type:'explanation', below:true});

    return items;
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
