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
      if (this.props.locationId !== null) {
        let state = this.props.store.getState();
        let room = state.spheres[this.props.sphereId].locations[this.props.locationId];
        if (room)
          this.forceUpdate();
        else {
          Actions.pop()
        }
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderer(item, index, stoneId) {
    return (
      <TouchableHighlight
        key={stoneId + '_entry'}
        onPress={() => {Actions.deviceEdit({sphereId:this.props.sphereId, stoneId, locationId:this.props.locationId})}}
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

  render() {
    const store   = this.props.store;
    const state   = store.getState();

    let items = getRoomContentFromState(state, this.props.sphereId, this.props.locationId);

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>

          <Explanation text='AVAILABLE DEVICES'/>
          <SeparatedItemList items={items} renderer={this._renderer.bind(this)} separatorIndent={false} />
          <Explanation text='Room name and Icon are changed through the settings. Click on the cog icon in the tab bar below to go to the settings.'/>
        </ScrollView>
      </Background>
    )
  }
}
