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
import { DeviceOverview } from '../components/DeviceOverview'
import { ListEditableItems } from './../components/ListEditableItems'
import { getGroupContentFromState, getRoomName } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'

export class SettingsRoom extends Component {

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
    const store = this.props.store;
    const state = store.getState();
    const room  = state.groups[this.props.groupId].locations[this.props.locationId];

    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId};
    let items = [];

    items.push({label:'ROOM SETTINGS',  type:'explanation', below:false});
    items.push({label:'Room Name', type: 'textEdit', value: room.config.name, callback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }});
    items.push({label:'Icon', type: 'icon', value: room.config.icon, callback: () => {
      Actions.roomIconSelection({locationId: this.props.locationId, icon: room.config.icon, groupId: this.props.groupId})
    }});

    items.push({label:'INDOOR LOCALIZATION', type: 'explanation',  below:false});
    items.push({label:'Retrain Room', type: 'navigation', callback: () => {
      Alert.alert('Retrain Room','Only do this if you experience issues with the indoor localization.',[
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {Actions.roomTraining({roomName: room.config.name, locationId: this.props.locationId})}},
      ])
    }});
    items.push({label:'If the indoor localization seems off or when you have moved Crownstones around, ' +
    'you can retrain this room to improve accuracy.', type: 'explanation',  below:true});

    items.push({
      label: 'Remove Room',
      type: 'button',
      callback: () => {
        store.dispatch()
      }
    });
    items.push({label:'Removing this Room will make all contained Crownstones floating.',  type:'explanation', below:true});

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
