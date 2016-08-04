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

export class SettingsInvite extends Component {
  constructor() {
    super();
    this.state = {
      email: ''
    };
    this.inputStates = {email: false};
  }


  _getItems() {
    let items = [];
    items.push({type:'spacer'});
    items.push({
      label: 'Email',
      type: 'textEdit',
      validation:'email',
      validationMethod:'icons',
      keyboardType: 'email-address',
      value: this.state.email,
      placeholder: 'Send invite to?',
      validationCallback: (newState) => {this.inputStates.email = newState},
      alwaysShowState: false,
      callback: (newValue) => {}
    });

    items.push({label:'Admins can add, configure and remove Crownstones and Rooms.', style:{paddingBottom:0}, type:'explanation', below:true});
    items.push({type:'spacer'});
    items.push({
      label: 'Invite',
      type:  'button',
      style: {color:colors.blue.hex},
      callback: this.validateAndContinue.bind(this)
    });

    items.push({
      label: 'By tapping Next, you agree to be awesome.',
        type: 'explanation',
      below: true
    });
    return items;
  }

  validateAndContinue() {
    console.log("HAPPY DAYS!", this.state, this.inputStates)
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
