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
import { getGroupContentFromState, getRoomName } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'

export class SettingsCrownstone extends Component {


  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    items.push({label:'FIRMWARE UPDATE',  type:'explanation', below:false});
    items.push({label:'Check for updates', style:{color: colors.blue.hex}, type:'button', callback:() => {} });
    items.push({label:'This Crownstone is up to date.',  type:'explanation', below:true});

    items.push({label:'DANGER',  type:'explanation', below:false});
    items.push({
      label: 'Remove from Group',
      type: 'button',
      callback: () => {

      }
    });
    items.push({label:'Removing this Crownstone from its Group will reset it back to factory defaults',  type:'explanation', below:true});

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
