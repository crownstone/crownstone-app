import React, { Component } from 'react'
import {
  Alert,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { DeviceEntry } from '../components/DeviceEntry'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { Explanation } from '../components/editComponents/Explanation'
import { getRoomContentFromState } from '../../util/dataUtil'

import { styles, colors } from '../styles'


export class RoomEdit extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderer(item, index, stoneId) {
    return (
      <TouchableHighlight
        key={stoneId + '_entry'}
        onPress={() => {Actions.deviceEdit({groupId:this.props.groupId, stoneId, locationId:this.props.locationId})}}
        style={{flex:1}}>
        <View style={styles.listView}>
          <DeviceEntry
            name={item.device.config.name}
            icon={item.device.config.icon}
            state={item.stone.state.state}
            currentUsage={item.stone.state.currentUsage}
            navigation={true}
            control={false}
          />
        </View>
      </TouchableHighlight>
    );
  }

  getTrainingButton(room) {
    let items = [];
    // room Name:
    items.push({label:'INDOOR LOCALIZATION', type: 'explanation',  below:false});
    items.push({label:'Retrain Room', type: 'navigation', callback: () => {
      Alert.alert('Retrain Room','Only do this if you experience issues with the indoor localization.',[
        {text: 'Cancel', style: 'cancel'},
        {text: 'OK', onPress: () => {Actions.roomTraining({roomName: room.config.name, locationId: this.props.locationId})}},
      ])
    }});
    items.push({label:'If the indoor localization seems off or when you have moved Crownstones around, ' +
    'you can retrain this room to improve accuracy.', type: 'explanation',  below:true});
    return items;
  }

  constructOptions(store, room) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId};
    let items = [];
    // room Name:
    items.push({type: 'spacer'});
    items.push({label:'Room Name', type: 'textEdit', value: room.config.name, callback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }});
    items.push({label:'Icon', type: 'icon', value:room.config.icon, callback: () => {}});
    //items.push({label:'Picture', type: 'picture', value:undefined, callback: () => {}});
    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];

    let items = getRoomContentFromState(state, this.props.groupId, this.props.locationId);

    let options = this.constructOptions(store, room);
    let training = this.getTrainingButton(room);
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true}/>
          <Explanation text='DEVICES IN ROOM:' />
          <SeparatedItemList items={items} renderer={this._renderer.bind(this)} separatorIndent={false} />
          <ListEditableItems items={training} separatorIndent={true}/>
        </ScrollView>
      </Background>
    )
  }
}
