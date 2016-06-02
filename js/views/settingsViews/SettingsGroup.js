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
import { styles, colors } from './../styles'


export class SettingsGroup extends Component {
  _getOwners(state) {
    return {label:'Alex de Mulder', type:'navigation', icon: <ProfilePicture pictusre={'https://s-media-cache-ak0.pinimg.com/236x/77/15/e7/7715e7ea54a010649d68b3a7198a8920.jpg'} />, callback: () => {}};
  }

  _getMembers(state) {
    return {label:'_getMembers', type:'navigation', callback: () => {}};
  }

  _getGuests(state) {
    return {label:'_getGuests', type:'navigation', callback: () => {}};
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    items.push({label:'ADMINS:',  type:'explanation', below:false});
    items.push(this._getOwners(state));
    items.push({label:'Admins can add, configure and remove Crownstones and Rooms.', style:{paddingBottom:0}, type:'explanation', below:true});

    items.push({label:'MEMBERS:',  type:'explanation', below:false});
    items.push(this._getMembers(state));
    items.push({label:'Members can configure Crownstones.', style:{paddingBottom:0}, type:'explanation', below:true});

    items.push({label:'GUESTS:',  type:'explanation', below:false});
    items.push(this._getGuests(state));
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
