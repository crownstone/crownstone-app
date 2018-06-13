import * as React from 'react'; import { Component } from 'react';
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
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { ProfilePicture } from '../components/ProfilePicture'
import { IconButton } from '../components/IconButton'
import { Bluenet } from '../../native/libInterface/Bluenet'
const Actions = require('react-native-router-flux').Actions;
import { colors } from './../styles';
import { getStonesAndAppliancesInSphere } from '../../util/DataUtil';
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import { Util } from "../../util/Util";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {BackAction} from "../../util/Back";
import {OrangeLine} from "../styles";

export class SettingsSphere extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: sphere.config.name,
    }
  };


  deleting : boolean;
  validationState : any;
  unsubscribeStoreEvents : any;

  constructor(props) {
    super(props);

    const state = props.store.getState();
    let sphereSettings = state.spheres[props.sphereId].config;

    this.state = {sphereName: sphereSettings.name};
    this.deleting = false;
    this.validationState = {sphereName:'valid'};
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereUsers  && change.changeSphereUsers.sphereIds[this.props.sphereId]  ||
        change.updateSphereUser   && change.updateSphereUser.sphereIds[this.props.sphereId]   ||
        change.changeSpheres      && change.changeSpheres.sphereIds[this.props.sphereId]      ||
        change.changeSphereConfig && change.changeSphereConfig.sphereIds[this.props.sphereId]
      ) {
        if (this.deleting === false)
          this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  _getUsersWithAccess(state, accessLevel) {
    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    let result = [];
    let users = state.spheres[this.props.sphereId].users;
    for (let userId in users) {
      if (users.hasOwnProperty(userId)) {
        if (users[userId].accessLevel == accessLevel) {
          if (users[userId].invitationPending === true) {
            result.push({
              label: users[userId].email,
              type: (userId === state.user.userId || spherePermissions.manageUsers === false) ? 'info' : 'navigation',
              icon: <IconButton name='ios-mail' size={27} radius={17} button={true} color={colors.white.hex} style={{position:'relative', top:1}} buttonStyle={{backgroundColor: colors.darkGray.hex, width:34, height:34, marginLeft:3}}/>,
              callback: () => {
                Actions.settingsSphereInvitedUser({
                  title: users[userId].email,
                  userId: userId,
                  invitePending: true,
                  sphereId: this.props.sphereId
                });
              }
            });
          }
          else {
            result.push({
              label: users[userId].firstName + " " + users[userId].lastName,
              type: (userId === state.user.userId ||  spherePermissions.manageUsers === false) ? 'info' : 'navigation',
              icon: <ProfilePicture picture={users[userId].picture} borderless={false} />,
              callback: () => {
                Actions.settingsSphereUser({
                  title: users[userId].firstName,
                  userId: userId,
                  sphereId: this.props.sphereId
                });
              }
            });
          }
        }
      }
    }

    return result
  }

  _getDelayLabel(delay) {
    if (delay === undefined || delay == 0)
      return 'None';

    if (delay < 60) {
      return 'after ' + Math.floor(delay) + ' seconds';
    }
    else {
      return 'after ' + Math.floor(delay/60) + ' minutes';
    }
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    if (spherePermissions.editSphere) {
      let sphereSettings = state.spheres[this.props.sphereId].config;
      items.push({label:'SPHERE SETTINGS',  type:'explanation', below:false});
      items.push({
        type:'textEdit',
        label:'Name',
        value: this.state.sphereName,
        validation:{minLength:2},
        validationCallback: (result) => {this.validationState.sphereName = result;},
        callback: (newText) => {
          this.setState({sphereName: newText});
        },
        endCallback: (newText) => {
          if (sphereSettings.name !== newText) {
            if (this.validationState.sphereName === 'valid' && newText.trim().length >= 2) {
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
              Alert.alert('Sphere name must be at least 2 letters long', 'Please try again.', [{text: 'OK'}]);
            }
          }
        }
      });
    }

    let ai = Util.data.getAiData(state, this.props.sphereId);

    items.push({label:'PERSONAL ARTIFICIAL INTELLIGENCE',  type:'explanation', below:false});
    items.push({
      label: ai.name,
      type: spherePermissions.editSphere ? 'navigation' : 'info',
      icon: <IconButton name='c1-brain' size={21} radius={15} button={true} color="#fff" buttonStyle={{backgroundColor: colors.iosBlue.hex, marginLeft:3, marginRight:7}}/>,
      callback: () => {
        Actions.aiStart({sphereId: this.props.sphereId, canGoBack: true});
      }
    });
    items.push({label: ai.name + ' will do ' + ai.his + ' very best help you!',  type:'explanation', style:{paddingBottom:0}, below:true});

    if (spherePermissions.editSphere) {
      let options = [];
      options.push({label: '5 Minutes', value: 300});
      options.push({label: '10 Minutes', value: 600});
      options.push({label: '15 Minutes', value: 900});
      options.push({label: '30 Minutes', value: 1800});
      items.push({label: 'SPHERE EXIT DELAY', type: 'explanation', below: false});
      items.push({
        type: 'dropdown',
        label: 'Delay',
        value: Math.max(300, state.spheres[this.props.sphereId].config.exitDelay), // max to allow older versions of the app that have a timeout of 2 minutes to also turn off at 5
        valueLabel: this._getDelayLabel(state.spheres[this.props.sphereId].config.exitDelay),
        dropdownHeight: 130,
        items: options,
        buttons: true,
        callback: (newValue) => {
          LOG.info("SettingsSphere: new Value for exit delay", newValue);
          store.dispatch({
            sphereId: this.props.sphereId,
            type: 'UPDATE_SPHERE_CONFIG',
            data: {exitDelay: newValue}
          });
        }
      });
      items.push({
        label: 'If nobody is left in the sphere, the Crownstones that are configured to switch when you leave the sphere will do so after this delay.',
        type: 'explanation',
        below: true,
        style: {paddingBottom: 0}
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

    if (spherePermissions.inviteAdminToSphere || spherePermissions.inviteMemberToSphere || spherePermissions.inviteGuestToSphere) {
      items.push({label:'ADD PEOPLE TO YOUR SPHERE', type:'explanation'});
      items.push({
        label: 'Invite someone new', // accessLevel[0].toUpperCase() + accessLevel.substring(1),  this capitalizes the first letter of the access level
        type: 'navigation',
        labelStyle: {color:colors.blue.hex},
        icon: <IconButton name="md-add" size={22} color="#fff" buttonStyle={{backgroundColor:colors.green.hex, marginLeft:3, marginRight:7}} />,
        callback: () => {
          Actions.settingsSphereInvite({sphereId: this.props.sphereId});
        }
      });
    }


    items.push({label:'DANGER',  type:'explanation', below: false});
    let leaveColor = spherePermissions.deleteSphere ? colors.orange.hex : colors.red.hex;
    items.push({
      label: 'Leave this Sphere',
      icon: <IconButton name="md-exit" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: leaveColor, marginLeft:3, marginRight:7}} />,
      style: {color:leaveColor},
      type: 'button',
      callback: () => {
        this._leaveSphere(state);
      }
    });
    items.push({label:'Leaving a sphere cannot be undone. You will have to be invited again.',  type:'explanation', below:true});

    if (spherePermissions.deleteSphere) {
      items.push({
        label: 'Delete this Sphere',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex, marginLeft:3, marginRight:7}} />,
        type: 'button',
        callback: () => {
          this._deleteSphere(state);
        }
      });
      items.push({label:'Deleting a sphere cannot be undone.',  type:'explanation', below:true});
    }

    return items;
  }

  _leaveSphere(state) {
    Alert.alert(
      "Are you sure you want to leave this Sphere?",
      "If you are the Sphere owner, you will have to transfer ownership first.",
      [
        {text:'No'},
        {text:'Yes', onPress:() => {
            this.props.eventBus.emit('showLoading','Removing you from this Sphere in the Cloud.');
            CLOUD.forUser(state.user.userId).leaveSphere(this.props.sphereId)
              .then(() => {
                this._processLocalDeletion()
              })
              .catch((err) => {
                let explanation = "Please try again later.";
                if (err && err.data && err.data.error && err.data.error.message === "can't exit from sphere where user with id is the owner") {
                  explanation = "You are the owner of this Sphere. You cannot leave without transferring ownership to another user.";
                }

                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not leave Sphere!", explanation, [{text:"OK"}]);
              })
        }}
      ]
    );
  }

  _processLocalDeletion(){
    this.props.eventBus.emit('hideLoading');
    this.deleting = true;
    BackAction();

    let state = this.props.store.getState();
    let actions = [];
    if (state.app.activeSphere === this.props.sphereId)
      actions.push({type:"CLEAR_ACTIVE_SPHERE"});

    actions.push({type:'REMOVE_SPHERE', sphereId: this.props.sphereId});

    // stop tracking sphere.
    Bluenet.stopTrackingIBeacon(state.spheres[this.props.sphereId].config.iBeaconUUID);
    this.props.store.batchDispatch(actions);
  }

  _deleteSphere(state) {
    Alert.alert(
      "Are you sure you want to delete this Sphere?",
      "This is only possible if you have removed all Crownstones from this Sphere.",
      [
        {text:'No'},
        {text:'Yes', onPress:() => {
          let stones = getStonesAndAppliancesInSphere(state, this.props.sphereId);
          let stoneIds = Object.keys(stones);
          if (stoneIds.length > 0) {
            Alert.alert(
              "Still Crownstones detected in Sphere",
              "You can remove then by going to them in their rooms, tap them, click on the settings -> edit and press remove.",
              [{text:'OK'}]
            );
          }
          else {
            this.props.eventBus.emit('showLoading','Removing this Sphere in the Cloud.');
            CLOUD.forSphere(this.props.sphereId).deleteSphere()
              .then(() => {
                this._processLocalDeletion();
              })
              .catch((err) => {
                this.props.eventBus.emit('hideLoading');
                Alert.alert("Could not delete Sphere!", "Please try again later.", [{text:"OK"}]);
              })
          }
        }}
      ]
    );
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
