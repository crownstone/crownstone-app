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
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'


export class SettingsGroupIndex extends Component {

  _getGroups(state) {
    return {label:'Groups', type:'navigation', callback: () => {}};
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    items.push({label:'Groups in which you are an Admin.',  type:'explanation', below:false});
    items.push(this._getGroups(state));
    items.push({label:'Groups in which you are an User.',  type:'explanation', below:false});
    items.push(this._getGroups(state));
    items.push({label:'Groups in which you are a Guest.',  type:'explanation', below:false});
    items.push(this._getGroups(state));

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
