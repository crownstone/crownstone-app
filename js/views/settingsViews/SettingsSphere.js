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
import { IconButton } from '../components/IconButton'
import { Bluenet } from '../../native/Proxy'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles';
import { getMyLevelInSphere, getSphereContentFromState } from '../../util/dataUtil';
import { Icon } from '../components/Icon';
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'

export class SettingsSphere extends Component {
  constructor() {
    super();
    this.deleting = false;
    this.validationState = {sphereName:'valid'};
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      if (this.deleting == false) {
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getUsersWithAccess(state,accessLevel) {
    let result = [];
    let users = state.spheres[this.props.sphereId].users;
    for (let userId in users) {
      if (users.hasOwnProperty(userId)) {
        if (users[userId].accessLevel == accessLevel) {
          LOG("SHOWING USER IN SPHERE", users, users[userId]);
          result.push({
            label:users[userId].firstName + " " + users[userId].lastName,
            type: userId === state.user.userId ? 'info' : 'navigation',
            icon: <ProfilePicture picture={users[userId].picture} />,
            callback: () => {
              Actions.settingsSphereUser({title: users[userId].firstName, userId: userId, sphereId: this.props.sphereId});
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

    if (getMyLevelInSphere(state, this.props.sphereId) == 'admin') {
      let sphereSettings = state.spheres[this.props.sphereId].config;
      items.push({label:'SPHERE SETTINGS',  type:'explanation', below:false});
      items.push({
        type:'textEdit',
        label:'Name',
        value: sphereSettings.name,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.sphereName = result;},
        callback: (newText) => {
          if (sphereSettings.name !== newText) {
            if (this.validationState.sphereName === 'valid') {
              this.props.eventBus.emit('showLoading', 'Changing sphere name...');
              CLOUD.forSphere(this.props.sphereId).changeSphereName(newText)
                .then((result) => {
                  store.dispatch({type: 'UPDATE_SPHERE_CONFIG', sphereId: this.props.sphereId,  data: {name: newText}});
                  this.props.eventBus.emit('hideLoading');
                })
                .catch((err) => {
                  this.props.eventBus.emit('hideLoading');
                })
            }
            else {
              Alert.alert('Sphere name must be at least 3 letters long', 'Please try again.', [{text: 'OK'}]);
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

    let level = getMyLevelInSphere(state, this.props.sphereId);
    if (level == "admin" || level == 'member') {
      items.push({label:'ADD PEOPLE TO YOUR SPHERE', type:'explanation'});
      items.push({
        label: 'Invite someone new', // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
        type: 'navigation',
        labelStyle: {color:colors.blue.hex},
        icon: <IconButton name="md-add" size={22} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />,
        callback: () => {
          Actions.settingsSphereInvite({sphereId: this.props.sphereId});
        }
      });
    }


    if (getMyLevelInSphere(state, this.props.sphereId) == 'admin') {
      items.push({type:'spacer'});
      items.push({
        label: 'Delete this Sphere',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
        type: 'button',
        callback: () => {
          this._deleteSphere(state);
        }
      });
      items.push({label:'Deleting a sphere cannot be undone.',  type:'explanation', below:true});
    }

    return items;
  }

  _deleteSphere(state) {
    Alert.alert(
      "Are you sure you want to delete this Sphere?",
      "This is only possible if you have removed all Crownstones from this Sphere.",
      [
        {text:'No'},
        {text:'Yes', onPress:() => {
          let stones = getSphereContentFromState(state, this.props.sphereId);
          let stoneIds = Object.keys(stones);
          if (stoneIds.length > 0) {
            Alert.alert(
              "Still Crownstones detected in Sphere",
              "You can remove then by going to them in the overview, tap them, click on the socket icon and press remove.",
              [{text:'OK'}]
            );
          }
          else {
            this.props.eventBus.emit('showLoading','Removing this Sphere in the Cloud.');
            CLOUD.forSphere(this.props.sphereId).deleteSphere()
              .then(() => {
                this.props.eventBus.emit('hideLoading');
                this.deleting = true;
                Actions.pop();

                let state = this.props.store.getState();
                let actions = [];
                if (state.app.activeSphere === this.props.sphereId)
                  actions.push({type:"CLEAR_ACTIVE_SPHERE"});
                if (state.app.remoteSphere === this.props.sphereId)
                  actions.push({type:"CLEAR_REMOTE_SPHERE"});
                if (state.app.activeSphere === this.props.sphereId)
                  actions.push({type:"CLEAR_PREVIOUSLY_ACTIVE_SPHERE"});

                actions.push({type:'REMOVE_SPHERE', sphereId: this.props.sphereId});

                // stop tracking sphere.
                Bluenet.stopTrackingIBeacon(state.spheres[this.props.sphereId].config.iBeaconUUID);
                this.props.store.batchDispatch(actions);
              })
          }
        }}
      ]
    );
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
