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

import { Background }  from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { NativeBridge } from '../../native/NativeBridge'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
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
      console.log("rerendering the room");
      this.forceUpdate();
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
            onChange={(newValue) => {
              this.setRequest(stoneId);
              NativeBridge.connectAndSetSwitchState(item.stone.config.uuid, newValue)
                .then(() => {
                  let data = {state:newValue};
                  if (newValue === 0)
                    data.currentUsage = 0;

                  this.props.store.dispatch({
                    type: 'UPDATE_STONE_STATE',
                    groupId: this.props.groupId,
                    locationId: this.props.locationId,
                    stoneId: stoneId,
                    data: data
                  });
                  this.clearRequest(stoneId);

                })
                .catch((err) => {
                  this.clearRequest(stoneId);
                })
            }}
          />
        </View>
      </View>
    );
  }

  setRequest(id) {
    let pendingRequests = this.state.pendingRequests;
    pendingRequests[id] = true;
    this.setState({pendingRequests:pendingRequests})
  }

  clearRequest(id) {
    let pendingRequests = this.state.pendingRequests;
    delete pendingRequests[id];
    this.setState({pendingRequests:pendingRequests})
  }

  

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];

    let usage = getCurrentPowerUsageFromState(state, this.props.groupId, this.props.locationId);
    let users = getPresentUsersFromState(state, this.props.groupId, this.props.locationId);

    // update the title in case the editing has changed it
    // we get it from the state instead of the props so it reflects changes in the edit screen.
    this.props.navigationState.title = room.config.name;

    let items = getRoomContentFromState(state, this.props.groupId, this.props.locationId);

    return (
      <Background background={require('../../images/mainBackgroundLight.png')}>
        <RoomBanner presentUsers={users} usage={usage} />
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
