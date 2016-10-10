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
import { SetupDeviceEntry } from '../components/SetupDeviceEntry'
import { BLEutil } from '../../native/BLEutil'
import { BleActions, NativeBus } from '../../native/Proxy'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
var Actions = require('react-native-router-flux').Actions;
import { 
  getPresentUsersFromState, 
  getCurrentPowerUsageFromState, 
  getRoomContentFromState 
} from '../../util/dataUtil'
import { Icon } from '../components/Icon'
import { Separator } from '../components/Separator'
import { styles, colors, screenWidth } from '../styles'


export class RoomOverview extends Component {
  constructor(props) {
    super();
    this.state = {pendingRequests:{}, seeStoneInSetupMode: props.seeStoneInSetupMode && props.locationId === null};
    this.unsubscribeNative = undefined;
    this.unsubscribeSetupEvents = [];

    // setup is used for floating crownstones.
    this.setupModeTimeout = undefined;
    this.lastSuccessfulSetupHandle = undefined;
    this.setupData = props.setupData ? {...props.setupData} : {};
  }

  createSetupTimeout(handle) {
    clearTimeout(this.setupModeTimeout);
    this.setupModeTimeout = setTimeout(() => {
      if (this.setupInProgress !== undefined) {
        this.createSetupTimeout(handle);
        return;
      }
      
      this.cleanupAfterSetup(handle);
    }, 5000);
  };

  cleanupAfterSetup(handle) {
    // cleanup and redraw
    delete this.setupData[handle];
    this.setState({seeStoneInSetupMode: false});
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled",  (handle) => {this.setupInProgress = undefined;}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress", (handle) => {this.setupInProgress = handle; this.forceUpdate()}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupComplete",   (handle) => {
      // use this to avoid the last events of the successful setup mode.
      this.lastSuccessfulSetupHandle = handle;
      setTimeout(() => {this.lastSuccessfulSetupHandle = undefined}, 3000);
      this.setupInProgress = undefined;
      this.cleanupAfterSetup(handle);
    }));
    
    // check if we are a floating crownstone container, in that case we listen for setup stones.
    if (this.props.locationId === null) {
      this.unsubscribeNative = NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        // use this to avoid the last events of the successful setup mode.
        if (setupAdvertisement.handle === this.lastSuccessfulSetupHandle)
          return;

        let forceRefresh = false;
        if (this.setupData[setupAdvertisement.handle] === undefined) {
          this.setupData[setupAdvertisement.handle] = setupAdvertisement;
          forceRefresh = true;
        }

        if (this.state.seeStoneInSetupMode === false) {
          this.setState({seeStoneInSetupMode: true});
          forceRefresh = false;
        }
        else {
          if (this.setupModeTimeout !== undefined) {
            clearTimeout(this.setupModeTimeout);
            this.setupModeTimeout = undefined;
          }
        }

        if (forceRefresh === true) {
          this.forceUpdate();
        }

        // handle case for timeout (user moves away from crownstone
        this.createSetupTimeout(setupAdvertisement.handle);
      });
    }

    this.unsubscribe = this.props.store.subscribe(() => {
      // guard against deletion of the room
      if (this.props.locationId !== null) {
        let state = this.props.store.getState();
        let room = state.spheres[this.props.sphereId].locations[this.props.locationId];
        if (room) {
          this.forceUpdate();
        }
        else {
          Actions.pop();
        }
      }
      else {
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    clearTimeout(this.setupModeTimeout);
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeSetupEvents = [];

    if (this.unsubscribeNative !== undefined) {
      this.unsubscribeNative();
    }
    this.unsubscribe();
  }

  _renderer(item, index, stoneId) {
    if (item.serviceData && item.handle) {
      let disabled = this.setupInProgress === undefined ? false : this.setupInProgress !== item.handle;
      return (
        <View key={stoneId + '_entry'}>
          <View style={styles.listView}>
            <SetupDeviceEntry
              key={stoneId + '_element'}
              eventBus={this.props.eventBus}
              store={this.props.store}
              setup={true}
              sphereId={this.props.sphereId}
              handle={item.handle}
              item={item}
              disabled={disabled}
            />
          </View>
        </View>
      )
    }
    else {
      return (
        <View key={stoneId + '_entry'}>
          <View style={styles.listView}>
            <DeviceEntry
              eventBus={this.props.eventBus}
              name={item.device.config.name}
              icon={item.device.config.icon}
              state={item.stone.state.state}
              currentUsage={item.stone.state.currentUsage}
              navigation={false}
              control={this.props.remote === false}
              disabled={this.state.pendingRequests[stoneId] !== undefined || this.props.remote}
              dimmable={item.device.config.dimmable}
              onChange={(switchState) => {
                this.showPending(stoneId);
                let data = {state: switchState};
                if (switchState === 0) {
                  data.currentUsage = 0;
                }
                let proxy = BLEutil.getProxy(item.stone.config.handle);
                proxy.perform(BleActions.setSwitchState, switchState)
                  .then(() => {
                    this.props.store.dispatch({
                      type: 'UPDATE_STONE_STATE',
                      sphereId: this.props.sphereId,
                      stoneId: stoneId,
                      data: data
                    });
                    this.clearPending(stoneId);
                  })
                  .catch((err) => {
                    this.clearPending(stoneId);
                  })
              }}
              onMove={() => { Actions.roomSelection({sphereId: this.props.sphereId, stoneId: stoneId, remote: this.props.remote})}}
              onChangeType={() => { Actions.deviceEdit({sphereId: this.props.sphereId, stoneId: stoneId, remote: this.props.remote})}}
              onChangeSettings={() => { Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: stoneId, remote: this.props.remote})}}
            />
          </View>
        </View>
      );
    }
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

  getItems(stones) {
    // hide the setup-in-progress crownstone from this list
    if (this.setupInProgress !== undefined) {
      let stoneIds = Object.keys(stones);

      let newStones = {};
      stoneIds.forEach((stoneId) => {
        if (stones[stoneId].stone.config.handle !== this.setupInProgress) {
          newStones[stoneId] = stones[stoneId];
        }
      });

      stones = newStones;
    }

    // merge the setup data with the available stones.
    if (this.state.seeStoneInSetupMode === true) {
      stones = {...stones, ...this.setupData};
    }

    return (
      <SeparatedItemList
        items={stones}
        separatorIndent={false}
        renderer={this._renderer.bind(this)}
      />
    )
  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let usage = getCurrentPowerUsageFromState(state, this.props.sphereId, this.props.locationId);
    let users = getPresentUsersFromState(state, this.props.sphereId, this.props.locationId);
    let stones = getRoomContentFromState(state, this.props.sphereId, this.props.locationId);

    let backgroundImage = this.props.getBackground.call(this, 'main');

    if (Object.keys(stones).length == 0 && this.state.seeStoneInSetupMode == false) {
      return (
        <Background image={backgroundImage} >
          <RoomBanner presentUsers={users} noCrownstones={true} floatingCrownstones={this.props.locationId === null} remote={this.props.remote} />
          <Separator fullLength={true} />
          <DeviceEntry empty={true} floatingCrownstones={this.props.locationId === null} />
          <Separator fullLength={true} />
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <Icon name="c2-pluginFront" size={0.75 * screenWidth} color="#fff" style={{backgroundColor:'transparent'}} />
          </View>
        </Background>
      );
    }
    else {
      return (
        <Background image={backgroundImage} >
          <RoomBanner presentUsers={users} usage={usage} floatingCrownstones={this.props.locationId === null} remote={this.props.remote}  />
          <ScrollView>
            {this.getItems(stones)}
          </ScrollView>
        </Background>
      );
    }

  }
}
