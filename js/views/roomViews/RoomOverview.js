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

import { stoneTypes } from '../../router/store/reducers/stones'
import { Background }   from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SetupDeviceEntry } from '../components/SetupDeviceEntry'
import { BLEutil } from '../../native/BLEutil'
import { BleActions, NativeBus } from '../../native/Proxy'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
import { getUUID } from '../../util/util'
var Actions = require('react-native-router-flux').Actions;
import { 
  getPresentUsersFromState, 
  getCurrentPowerUsageFromState, 
  getRoomContentFromState 
} from '../../util/dataUtil'
import { Icon } from '../components/Icon'
import { Separator } from '../components/Separator'
import { styles, colors, screenWidth } from '../styles'
import { LOG, LOGDebug } from '../../logging/Log'


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
    this.viewingRemotely = true;
    this.uuid = getUUID();

  }

  createSetupTimeout(handle) {
    clearTimeout(this.setupModeTimeout);
    this.setupModeTimeout = setTimeout(() => {
      if (this.setupInProgress !== undefined) {
        this.createSetupTimeout(handle);
        return;
      }
      
      this.cleanupAfterSetup(handle);
    }, 3000);
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
        // we scan in HF to get the most up to date impression of our surroundings
        BLEutil.startHighFrequencyScanning(this.uuid);

        // use this to avoid the last events of the successful setup mode.
        if (setupAdvertisement.handle === this.lastSuccessfulSetupHandle)
          return;

        // update if we see a new crownstone in setup mode
        let forceRefresh = false;
        if (this.setupData[setupAdvertisement.handle] === undefined) {
          this.setupData[setupAdvertisement.handle] = setupAdvertisement;
          forceRefresh = true;
        }

        // update if we have not yet seen a crownstone in setup mode: force refresh is set to false since setState already redraws
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

    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId]) {
        Actions.pop();
        return;
      }

      if (
        (change.stoneUsageUpdated && change.stoneUsageUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeSphereState && change.changeSphereState.sphereIds[this.props.sphereId]) ||
        (change.changeStoneState  && change.changeStoneState.sphereIds[this.props.sphereId])  ||
        (change.stoneLocationUpdated && change.stoneLocationUpdated.sphereIds[this.props.sphereId])  ||
        (change.changeStones)
      ) {
        this.forceUpdate();
        return;
      }

      // actions specifically for location that are not floating
      if (this.props.locationId !== null) {
        if (
          (change.userPositionUpdate   && change.userPositionUpdate.locationIds[this.props.locationId])   ||
          (change.updateLocationConfig && change.updateLocationConfig.locationIds[this.props.locationId])
        ) {
          this.forceUpdate();
        }
      }
    });

    // tell the component exactly when it should redraw
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
    this.unsubscribeStoreEvents();
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
              currentUsage={item.stone.config.type !== stoneTypes.guidestone ? item.stone.state.currentUsage : undefined}
              navigation={false}
              control={item.stone.config.type !== stoneTypes.guidestone && this.viewingRemotely === false}
              pending={this.state.pendingRequests[stoneId] !== undefined} // either disabled, pending or remote
              disabled={item.stone.config.disabled || this.viewingRemotely} // either disabled or remote
              dimmable={item.device.config.dimmable}
              showBehaviour={item.stone.config.type !== stoneTypes.guidestone}
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
              onMove={() => { Actions.roomSelection({sphereId: this.props.sphereId, stoneId: stoneId, locationId: this.props.locationId, viewingRemotely: this.viewingRemotely})}}
              onChangeType={() => { Actions.deviceEdit({sphereId: this.props.sphereId, stoneId: stoneId, viewingRemotely: this.viewingRemotely})}}
              onChangeSettings={() => { Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: stoneId, viewingRemotely: this.viewingRemotely})}}
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

    // LOG("stones:", stones, "of which setup", this.setupData)
    return (
      <SeparatedItemList
        items={stones}
        separatorIndent={false}
        renderer={this._renderer.bind(this)}
      />
    )
  }

  render() {
    LOGDebug("redrawing room overview");
    const store = this.props.store;
    const state = store.getState();

    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false && this.state.seeStoneInSetupMode !== true;

    let usage  = getCurrentPowerUsageFromState(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersFromState(state, this.props.sphereId, this.props.locationId);
    let stones = getRoomContentFromState(state, this.props.sphereId, this.props.locationId);

    let backgroundImage = this.props.getBackground('main', this.viewingRemotely);

    let content = undefined;
    if (Object.keys(stones).length == 0 && this.state.seeStoneInSetupMode == false) {
      content = (
        <View>
          <RoomBanner presentUsers={users} noCrownstones={true} floatingCrownstones={this.props.locationId === null} viewingRemotely={this.viewingRemotely} />
          <Separator fullLength={true} />
          <DeviceEntry empty={true} floatingCrownstones={this.props.locationId === null} />
          <Separator fullLength={true} />
          <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
            <Icon name="c2-pluginFront" size={0.75 * screenWidth} color="#fff" style={{backgroundColor:'transparent'}} />
          </View>
        </View>
      );
    }
    else {
      content = (
        <View>
          <RoomBanner presentUsers={users} usage={usage} floatingCrownstones={this.props.locationId === null}
                      viewingRemotely={this.viewingRemotely}/>
          <ScrollView>
            {this.getItems(stones)}
          </ScrollView>
        </View>
      );
    }
    return (
      <Background image={backgroundImage} >
        {content}
      </Background>
    );
  }
}
