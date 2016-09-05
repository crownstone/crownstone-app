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
import { Icon } from '../components/Icon';
import { CLOUD } from '../../cloud/cloudAPI'


export class SettingsGroup extends Component {
  constructor() {
    super();
    this.validationState = {groupName:'valid'};
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getUsersWithAccess(state,accessLevel) {
    let result = [];
    let users = state.groups[this.props.groupId].users;
    for (let userId in users) {
      if (users.hasOwnProperty(userId)) {
        if (users[userId].accessLevel == accessLevel) {
          // console.log(users[userId])
          result.push({
            label:users[userId].firstName + " " + users[userId].lastName,
            type: userId === state.user.userId ? 'info' : 'navigation',
            icon: <ProfilePicture picture={users[userId].picture} />,
            callback: () => {
              Actions.settingsGroupUser({title: users[userId].firstName, userId: userId, groupId: this.props.groupId});
            }
          })
        }
      }
    }

    return result
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    if (getMyLevelInGroup(state, this.props.groupId) == 'admin') {
      let groupSettings = state.groups[this.props.groupId].config;
      items.push({label:'GROUP SETTINGS',  type:'explanation', below:false});
      items.push({
        type:'textEdit',
        label:'Name',
        value: groupSettings.name,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.groupName = result;},
        callback: (newText) => {
          if (groupSettings.name !== newText) {
            if (this.validationState.groupName === 'valid') {
              this.props.eventBus.emit('showLoading', 'Changing group name...');
              CLOUD.forGroup(this.props.groupId).changeGroupName(newText)
                .then((result) => {
                  store.dispatch({type: 'UPDATE_GROUP_CONFIG', groupId: this.props.groupId,  data: {name: newText}});
                  this.props.eventBus.emit('hideLoading');
                })
                .catch((err) => {
                  this.props.eventBus.emit('hideLoading');
                })
            }
            else {
              Alert.alert('Group name must be at least 3 letters long', 'Please try again.', [{text: 'OK'}]);
            }
          }
        }
      });
    }

    items.push({label:'ADMINS',  type:'explanation', below:false});
    items = items.concat(this._getUsersWithAccess(state,'admin'));
    items.push({label:'Admins can add, configure and remove Crownstones and Rooms.', style:{paddingBottom:0}, type:'explanation', below:true});

    let members = this._getUsersWithAccess(state,'member');
    if (members.length > 0) {
      items.push({label:'MEMBERS',  type: 'explanation', below: false});
      items = items.concat(members);
      items.push({label:'Members can configure Crownstones.', style:{paddingBottom:0}, type:'explanation', below:true});
    }

    let guest = this._getUsersWithAccess(state, 'guest');
    if (guest.length > 0) {
      items.push({label:'GUESTS',  type:'explanation', below: false});
      items = items.concat(guest);
      items.push({label:'Guests can control Crownstones and devices will remain on if they are the last one in the room.', style:{paddingBottom:0}, type:'explanation', below:true});
    }

    let level = getMyLevelInGroup(state, this.props.groupId);
    if (level == "admin" || level == 'member') {
      items.push({label:'ADD PEOPLE TO YOUR GROUP', type:'explanation'});
      items.push({
        label: 'Invite someone new', // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
        type: 'navigation',
        labelStyle: {color:colors.blue.hex},
        icon: <Icon name="ios-add-circle" size={30} color={colors.green.hex} style={{position:'relative', top:2}} />,
        callback: () => {
          Actions.settingsGroupInvite({groupId: this.props.groupId});
        }
      });
    }


    if (getMyLevelInGroup(state, this.props.groupId) == 'admin') {
      items.push({type:'spacer'});
      items.push({
        label: 'Delete this Group',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          Alert.alert(
            "Are you sure you want to delete this Group?",
            "This is only possible if you have reset all Crownstones in this Group.",
            [
              {text:'No'},
              {text:'Yes', onPress:() => {
                // TODO: check if there are still crownstones.
              }}
            ]
          );
        }
      })
      items.push({label:'Deleting a group cannot be undone.',  type:'explanation', below:true});
    }

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
