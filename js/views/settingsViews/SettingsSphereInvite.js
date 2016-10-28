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
import { getMyLevelInSphere } from '../../util/dataUtil';
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG, LOGError } from '../../logging/Log'

export class SettingsSphereInvite extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      permission:'Guest'
    };
    this.inputStates = {email: false};
  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();

    let items = [];
    items.push({type:'spacer'});
    items.push({
      label: 'Email',
      type: 'textEdit',
      autoCapitalize: 'none',
      validation:'email',
      validationMethod:'icons',
      keyboardType: 'email-address',
      value: this.state.email,
      placeholder: 'Send email to...',
      validationCallback: (newState) => {this.inputStates.email = newState},
      alwaysShowState: false,
      callback: (newValue) => {this.setState({email:newValue});}
    });


    let level = getMyLevelInSphere(state, this.props.sphereId);
    if (level == "admin") {
      items.push({
        type:'dropdown',
        label:'Access Level',
        value: this.state.permission,
        dropdownHeight:100,
        items:[{label:'Member'},{label:'Guest'}],
        callback: (permission) => {
          this.setState({permission:permission});
        }
      });
    }
    else {
      items.push({type:'info', label:'Access level', value:'Guest'});
    }

    if (this.state.permission == 'Member') {
      items.push({label:'Members can configure Crownstones.', type:'explanation', below:true});
    }
    else if (this.state.permission == 'Guest') {
      items.push({label:'Guests can control Crownstones and devices will remain on if they are the last one in the room.', type:'explanation', below:true});
    }


    items.push({
      label: 'Send invitation!',
      type:  'button',
      style: {color:colors.blue.hex},
      callback: this.validateAndContinue.bind(this)
    });

    return items;
  }

  validateAndContinue() {
    this.props.eventBus.emit('showLoading', 'Inviting User...');
    CLOUD.inviteUser(this.state.email.toLowerCase(), this.state.permission)
      .then(() => {
        this.props.eventBus.emit('hideLoading');
        Alert.alert("Invite has been sent!","An email has been sent to " + this.state.email + ".", [{text:'OK', onPress: () => {Actions.pop();}}])
      })
      .catch((err) => {
        this.props.eventBus.emit('hideLoading');
        LOGError("Error when inviting using:",err);
        Alert.alert("Could not send invite..","Please try again later.", [{text:'OK'}])
      })
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
