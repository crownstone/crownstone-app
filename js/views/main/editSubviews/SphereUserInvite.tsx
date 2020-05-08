
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereUserInvite", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ScrollView} from 'react-native';
import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'

import {colors, } from '../../styles';
import { CLOUD } from '../../../cloud/cloudAPI'
import {LOGe} from '../../../logging/Log'
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";

export class SphereUserInvite extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Invite"), closeModal: true});
  }

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
    const store = core.store;
    const state = store.getState();
    let spherePermissions = Permissions.inSphere(this.props.sphereId);
    let items = [];
    items.push({type:'spacer'});
    items.push({
      label: lang("Email"),
      type: 'textEdit',
      autoCapitalize: 'none',
      validation:'email',
      validationMethod:'icons',
      keyboardType: 'email-address',
      value: this.state.email,
      placeholder: lang("Send_email_to___"),
      validationCallback: (newState) => {this.inputStates.email = newState},
      alwaysShowState: false,
      callback: (newValue) => { this.setState({email:newValue}); }
    });


    if (spherePermissions.inviteMemberToSphere || spherePermissions.inviteAdminToSphere) {
      // generate permission items
      let dropDownItems = [];
      if (spherePermissions.inviteAdminToSphere ) { dropDownItems.push({label: lang("Admin")}); }
      if (spherePermissions.inviteMemberToSphere) { dropDownItems.push({label: lang("Member")}); }
      dropDownItems.push({label: lang("Guest")});

      items.push({
        type:'dropdown',
        label: lang("Access_Level"),
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
      items.push({type:'info', label: lang("Access_level"), value:'Guest'});
    }

    if (this.state.permission == 'Member') {
      items.push({label: lang("Members_can_configure_Cro"), type:'explanation', below:true});
    }
    else if (this.state.permission == 'Guest') {
      items.push({label: lang("Guests_can_control_Crowns"), type:'explanation', below:true});
    }


    items.push({
      label: lang("Send_invitation_"),
      type:  'button',
      style: {color:colors.blue3.hex},
      callback: () => {this.validateAndContinue(state);}
    });

    return items;
  }

  validateAndContinue(state) {
    if (!this.state.email) {
      Alert.alert(
        lang("_Please_provide_an_email__header"),
        lang("_Please_provide_an_email__body"),
        [{text:lang("_Please_provide_an_email__left")}]);
      return;
    }
    else if (!this.inputStates.email) {
      Alert.alert(
        lang("_Please_provide_a_valid_e_header"),
        lang("_Please_provide_a_valid_e_body"),
        [{text:lang("_Please_provide_a_valid_e_left")}]);
      return;
    }


    // verify if there is already a user with this email address in this sphere.
    let users = state.spheres[this.props.sphereId].users;
    let userIds = Object.keys(users);
    for (let i = 0; i < userIds.length; i++) {
      if (users[userIds[i]].email.toLowerCase() === this.state.email.toLowerCase()) {
        Alert.alert(
        lang("_User_already_in_Sphere___header"),
        lang("_User_already_in_Sphere___body"),
        [{text:lang("_User_already_in_Sphere___left")}]);
        return;
      }
    }

    // We only get here if the user does not exists in the sphere yet.
    core.eventBus.emit('showLoading', 'Inviting User...');
    CLOUD.forSphere(this.props.sphereId).inviteUser(this.state.email.toLowerCase(), this.state.permission)
      .then(() => {
        core.eventBus.emit('hideLoading');
        core.store.dispatch({
          type: 'ADD_SPHERE_USER',
          sphereId: this.props.sphereId,
          userId: this.state.email.toLowerCase(),
          data: { email: this.state.email.toLowerCase(), invitationPending: true, accessLevel: this.state.permission.toLowerCase()}
        });
        let defaultAction = () => { NavigationUtil.dismissModal(); };
        Alert.alert(
          lang("_Invite_has_been_sent___A_header"),
          lang("_Invite_has_been_sent___A_body",this.state.email),
          [{text:lang("_Invite_has_been_sent___A_left"), onPress: defaultAction}], { onDismiss: defaultAction })
      })
      .catch((err) => {
        core.eventBus.emit('hideLoading');
        LOGe.info("Error when inviting using:",err);
        Alert.alert(
          lang("_Could_not_send_invite____header"),
          lang("_Could_not_send_invite____body"),
          [{text:lang("_Could_not_send_invite____left")}])
      })
  }

  render() {

    return (
      <Background hasNavBar={false} image={core.background.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
