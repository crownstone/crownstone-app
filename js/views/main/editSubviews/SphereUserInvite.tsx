import { Languages } from "../../../Languages"
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
import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
const Actions = require('react-native-router-flux').Actions;
import {colors, OrangeLine} from '../../styles';
import { CLOUD } from '../../../cloud/cloudAPI'
import {LOG, LOGe} from '../../../logging/Log'
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {BackAction} from "../../../util/Back";

export class SphereUserInvite extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: Languages.title("SphereUserInvite", "Invite")()}
  };

  inputStates : any;

  constructor(props) {
    super(props);
    this.state = {
      email: '',
      permission:'Guest'
    };
    this.inputStates = {email: false};
  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    let items = [];
    items.push({type:'spacer'});
    items.push({
      label: Languages.label("SphereUserInvite", "Email")(),
      type: 'textEdit',
      autoCapitalize: 'none',
      validation:'email',
      validationMethod:'icons',
      keyboardType: 'email-address',
      value: this.state.email,
      placeholder: 'Send email to...',
      validationCallback: (newState) => {this.inputStates.email = newState},
      alwaysShowState: false,
      callback: (newValue) => { this.setState({email:newValue}); }
    });


    if (spherePermissions.inviteMemberToSphere || spherePermissions.inviteAdminToSphere) {
      // generate permission items
      let dropDownItems = [];
      if (spherePermissions.inviteAdminToSphere ) { dropDownItems.push({label: Languages.label("SphereUserInvite", "Admin")()}); }
      if (spherePermissions.inviteMemberToSphere) { dropDownItems.push({label: Languages.label("SphereUserInvite", "Member")()}); }
      dropDownItems.push({label: Languages.label("SphereUserInvite", "Guest")()});

      items.push({
        type:'dropdown',
        label: Languages.label("SphereUserInvite", "Access_Level")(),
        buttons: false,
        value: this.state.permission,
        dropdownHeight:130,
        items: dropDownItems,
        callback: (permission) => {
          this.setState({permission:permission});
        }
      });
    }
    else if (spherePermissions.inviteGuestToSphere) {
      items.push({type:'info', label: Languages.label("SphereUserInvite", "Access_level")(), value:'Guest'});
    }

    if (this.state.permission == 'Member') {
      items.push({label: Languages.label("SphereUserInvite", "Members_can_configure_Cro")(), type:'explanation', below:true});
    }
    else if (this.state.permission == 'Guest') {
      items.push({label: Languages.label("SphereUserInvite", "Guests_can_control_Crowns")(), type:'explanation', below:true});
    }


    items.push({
      label: Languages.label("SphereUserInvite", "Send_invitation_")(),
      type:  'button',
      style: {color:colors.blue.hex},
      callback: () => {this.validateAndContinue(state);}
    });

    return items;
  }

  validateAndContinue(state) {
    if (!this.state.email) {
      Alert.alert(
Languages.alert("SphereUserInvite", "_Please_provide_an_email__header")(),
Languages.alert("SphereUserInvite", "_Please_provide_an_email__body")(),
[{text:Languages.alert("SphereUserInvite", "_Please_provide_an_email__left")()}]);
      return;
    }
    else if (!this.inputStates.email) {
      Alert.alert(
Languages.alert("SphereUserInvite", "_Please_provide_a_valid_e_header")(),
Languages.alert("SphereUserInvite", "_Please_provide_a_valid_e_body")(),
[{text:Languages.alert("SphereUserInvite", "_Please_provide_a_valid_e_left")()}]);
      return;
    }


    // verify if there is already a user with this email address in this sphere.
    let users = state.spheres[this.props.sphereId].users;
    let userIds = Object.keys(users);
    for (let i = 0; i < userIds.length; i++) {
      if (users[userIds[i]].email.toLowerCase() === this.state.email.toLowerCase()) {
        Alert.alert(
Languages.alert("SphereUserInvite", "_User_already_in_Sphere___header")(),
Languages.alert("SphereUserInvite", "_User_already_in_Sphere___body")(),
[{text:Languages.alert("SphereUserInvite", "_User_already_in_Sphere___left")()}]);
        return;
      }
    }

    // We only get here if the user does not exists in the sphere yet.
    this.props.eventBus.emit('showLoading', 'Inviting User...');
    CLOUD.forSphere(this.props.sphereId).inviteUser(this.state.email.toLowerCase(), this.state.permission)
      .then(() => {
        this.props.eventBus.emit('hideLoading');
        this.props.store.dispatch({
          type: 'ADD_SPHERE_USER',
          sphereId: this.props.sphereId,
          userId: this.state.email.toLowerCase(),
          data: { email: this.state.email.toLowerCase(), invitationPending: true, accessLevel: this.state.permission.toLowerCase()}
        });
        let defaultAction = () => { BackAction(); };
        Alert.alert(
Languages.alert("SphereUserInvite", "_Invite_has_been_sent___A_header")(),
Languages.alert("SphereUserInvite", "_Invite_has_been_sent___A_body")(this.state.email),
[{text:Languages.alert("SphereUserInvite", "_Invite_has_been_sent___A_left")(), onPress: defaultAction}], { onDismiss: defaultAction })
      })
      .catch((err) => {
        this.props.eventBus.emit('hideLoading');
        LOGe.info("Error when inviting using:",err);
        Alert.alert(
Languages.alert("SphereUserInvite", "_Could_not_send_invite____header")(),
Languages.alert("SphereUserInvite", "_Could_not_send_invite____body")(),
[{text:Languages.alert("SphereUserInvite", "_Could_not_send_invite____left")()}])
      })
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
