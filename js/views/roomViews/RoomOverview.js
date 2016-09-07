import React, { Component } from 'react' 
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';

import { Background }   from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { BLEutil } from '../../native/BLEutil'
import { BleActions } from '../../native/Proxy'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
import { AdvertisementManager } from '../../logic/CrownstoneControl'
var Actions = require('react-native-router-flux').Actions;
import { 
  getPresentUsersFromState, 
  getCurrentPowerUsageFromState, 
  getRoomContentFromState 
} from '../../util/dataUtil'

import { styles, colors, width } from '../styles'


export class RoomOverview extends Component {
  constructor() {
    super();
    this.state = {pendingRequests:{}}
  }

  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      // guard against deletion of the room
      if (this.props.locationId !== null) {
        let state = this.props.store.getState();
        let room = state.groups[this.props.groupId].locations[this.props.locationId];
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
      <View key={stoneId + '_entry'}>
        <View style={styles.listView}>
          <DeviceEntry
            name={item.device.config.name}
            icon={item.device.config.icon}
            state={item.stone.state.state}
            currentUsage={item.stone.state.currentUsage}
            navigation={false}
            control={true}
            pending={this.state.pendingRequests[stoneId] !== undefined}
            dimmable={item.device.config.dimmable}
            onChange={(switchState) => {
              this.showPending(stoneId);
              let data = {state: switchState};
              if (switchState === 0) {
                data.currentUsage = 0;
              }
              let proxy = BLEutil.getProxy(item.stone.config.bluetoothId);
              proxy.perform(BleActions.setSwitchState, switchState)
                .then(() => {
                  this.props.store.dispatch({
                    type: 'UPDATE_STONE_STATE',
                    groupId: this.props.groupId,
                    stoneId: stoneId,
                    data: data
                  });
                  AdvertisementManager.resetData({crownstoneId: stoneId});
                  this.clearPending(stoneId);
                })
                .catch((err) => {
                  this.clearPending(stoneId);
                })
            }}
          />
        </View>
      </View>
    );
  }

  showPending(id) {
    let pendingRequests = this.state.pendingRequests;
    pendingRequests[id] = true;
    this.setState({pendingRequests:pendingRequests})
  }

  clearPending(id) {
    let pendingRequests = this.state.pendingRequests;
    delete pendingRequests[id];
    this.setState({pendingRequests:pendingRequests})
  }

  

  render() {
    const store = this.props.store;
    const state = store.getState();

    let usage = getCurrentPowerUsageFromState(state, this.props.groupId, this.props.locationId);
    let users = getPresentUsersFromState(state, this.props.groupId, this.props.locationId);
    let items = getRoomContentFromState(state, this.props.groupId, this.props.locationId);

    if (Object.keys(items).length == 0) {
      return (
        <Background image={this.props.backgrounds.main} >
          <RoomBanner presentUsers={users} noCrownstones={true}/>
          <ScrollView>
            <SeparatedItemList
              items={items}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
          </ScrollView>
        </Background>
      );
    }
    else {
      return (
        <Background image={this.props.backgrounds.main} >
          <RoomBanner presentUsers={users} usage={usage} floatingCrownstones={this.props.locationId === null}  />
          <ScrollView>
            <SeparatedItemList
              items={items}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
          </ScrollView>
        </Background>
      );
    }

  }
}
