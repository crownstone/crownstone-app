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
import { RoomOverview } from '../components/RoomOverview'
import { ListEditableItems } from './../components/ListEditableItems'
import { getStonesFromState, getGroupsWhereIHaveAccessLevel } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { Icon } from '../components/Icon';

export class SettingsRoomOverview extends Component {

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

    let groups = getGroupsWhereIHaveAccessLevel(state, 'admin');
    groups.forEach((group) => {
      let rooms = state.groups[group.id].locations;
      let roomIds = Object.keys(rooms);
      if (roomIds.length > 0) {
        items.push({label:"ROOMS IN GROUP '" + group.name + "'",  type:'explanation', below:false});
        roomIds.forEach((roomId) => {
          let room = rooms[roomId];
          items.push({__item:
            <TouchableHighlight
              key={roomId + '_entry'}
              onPress={() => {Actions.settingsRoom({locationId:roomId, groupId: group.id});}}
             >
              <View style={styles.listView}>
                <RoomOverview
                  icon={room.config.icon}
                  name={room.config.name}
                  stoneCount={Object.keys(getStonesFromState(state,group.id, roomId)).length}
                  navigation={true}
                />
                </View>
              </TouchableHighlight>})
        })
      }
      items.push({
        label: 'Add a Room to this Group',
        largeIcon: <Icon name="ios-add-circle" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
        style: {color:colors.blue.hex},
        type: 'button',
        callback: () => {
          Actions.settingsRoomAdd({groupId: group.id});
        }
      })
    });


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
