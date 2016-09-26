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
import { EditSpacer } from './../components/editComponents/EditSpacer'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'


export class AppComplexity extends Component {
  _getItems() {
    return [
      {type:'spacer'},
      {label:'Manage Profile',  type:'navigation',   callback: (newValue) => {}},
      {label:'Manage Sphere',    type:'navigation',   callback: (newValue) => {}},
      //{label:'Add, remove, or change the permissions of the people in your sphere.',  type:'explanation', below:true},
      {label:'Manage Crownstones', type:'navigation',  callback: (newValue) => {}},
      //{label:'Here you can reset Crownstones to factory settings. (ie. remove ownership)',  type:'explanation', below:true},
      {label:'Manage Locations',   type:'navigation',      callback: (newValue) => {}},
      //{label:'You can add or remove locations (rooms) to your app. Localization works in rooms without Crownstones but it may be less accurate.',  type:'explanation', below:true},
      {label:'App Complexity',     type:'navigation',      callback: (newValue) => {}},
      //{label:'You can add or remove features from your app interface to tailor it to your needs.',  type:'explanation', below:true},
      {type:'spacer'},
      {label:'Log Out',  type:'button', callback: () => {this._logoutPopup()}},
    ]
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
