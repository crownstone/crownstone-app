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
import { getGroupContentFromState, getRoomName, getGroupsWhereIHaveAccessLevel } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { Icon } from '../components/Icon';

export class SettingsCrownstoneOverview extends Component {
  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();

    let groups = getGroupsWhereIHaveAccessLevel(state, 'admin');
    groups.forEach((group) => {
      let stones = getGroupContentFromState(state, group.id);
      let stoneIds = Object.keys(stones);
      if (stoneIds.length > 0) {
        items.push({label:"CROWNSTONES IN GROUP '" + group.name + "'",  type:'explanation', below:false});
        stoneIds.forEach((stoneId) => {
          let stone = stones[stoneId];
          items.push({__item:
            <TouchableHighlight
              key={stoneId + '_entry'}
              onPress={() => {Actions.settingsCrownstone({stoneId:stoneId, groupId: group.id});}}
              style={{flex:1}}>
              <View style={styles.listView}>
                <DeviceOverview
                  icon={stone.device.config.icon}
                  stoneName={stone.stone.config.name}
                  deviceName={stone.device.config.name}
                  locationName={getRoomName(state, group.id, stone.stone.config.locationId)}
                  navigation={true}
                />
                </View>
              </TouchableHighlight>})
        })
      }
      items.push({
        label: 'Add a Crownstone to this Group',
        largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
        style: {color:colors.blue.hex},
        type: 'button',
        callback: () => {
          Actions.setupAddPluginStep1();
        }
      })
    });



    items.push({type:'spacer'});
    items.push({
      label: 'Recover a Crownstone',
      style: {color:colors.blue.hex},
      type: 'button',
      callback: () => {
        Actions.settingsPluginRecoverStep1();
      }
    });
    items.push({label:'If you want to reset a Crownstone because it is not responding correctly, click here and follow the instructions.',  type:'explanation', below:true});
    items.push({type:'spacer'});

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
