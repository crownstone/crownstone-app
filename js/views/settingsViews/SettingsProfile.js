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


export class SettingsProfile extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getItems(user) {
    let items = [];
    // room Name:
    console.log(user)
    items.push({label:'Picture', type: 'picture', value: user.picture, callback: () => {}});

    items.push({label:'First Name', type: 'textEdit', value: user.firstName, callback: (newText) => {}});
    items.push({label:'Last Name', type: 'textEdit', value: user.lastName, callback: (newText) => {}});
    items.push({label:'Email', type: 'textEdit', value: user.email, callback: (newText) => {}});
    items.push({label:'Change Password', type: 'navigation', callback: () => {}});

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;

    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={this._getItems(user)} />
        </ScrollView>
      </Background>
    );
  }
}
