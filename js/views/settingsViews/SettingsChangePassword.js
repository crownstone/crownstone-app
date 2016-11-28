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
let Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'


export class SettingsChangePassword extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems() {
    let requiredData = {sphereId: this.props.sphereId, locationId: this.props.locationId};
    let items = [];
    // room Name:
    items.push({label:'Picture', type: 'picture', value:undefined, callback: () => {}});
    items.push({label:'First Name', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'Last Name', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'Change Email', type: 'textEdit', value: room.config.name, callback: (newText) => {}});
    items.push({label:'Change Password', type: 'navigation', callback: () => {}});

    return items;
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
