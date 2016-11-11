import React, { Component } from 'react' 
import {
  Alert,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  View
} from 'react-native';


import { SetupStateHandler } from '../../native/SetupStateHandler'
import { stoneTypes } from '../../router/store/reducers/stones'
import { Background }   from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SetupDeviceEntry } from '../components/SetupDeviceEntry'
import { BLEutil } from '../../native/BLEutil'
import { BleActions, NativeBus } from '../../native/Proxy'
import { TopBar } from '../components/Topbar'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
import { userIsAdminInSphere } from '../../util/dataUtil'
import { getUUID } from '../../util/util'
var Actions = require('react-native-router-flux').Actions;
import { 
  getPresentUsersFromState, 
  getCurrentPowerUsageFromState, 
  getRoomContentFromState 
} from '../../util/dataUtil'
import { Icon } from '../components/Icon'
import { Separator } from '../components/Separator'
import { styles, colors, screenWidth, screenHeight, tabBarHeight, topBarHeight } from '../styles'
import { LOG, LOGDebug, LOGError } from '../../logging/Log'


export class RoomOverview extends Component {
  constructor(props) {
    super();
    this.state = {pendingRequests:{}, seeStoneInSetupMode: false};
    this.unsubscribeSetupEvents = [];

    this.viewingRemotely = true;
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled",   (handle) => { this.forceUpdate();}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress",  (handle) => { this.forceUpdate();}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate();}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupComplete",    (handle) => { this.forceUpdate();}));

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
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }

  _renderer(item, index, stoneId) {
    if (item.setupMode === true && item.handle) {
      return (
        <View key={stoneId + '_entry'}>
          <View style={styles.listView}>
            <SetupDeviceEntry
              key={stoneId + '_element'}
              eventBus={this.props.eventBus}
              store={this.props.store}
              sphereId={this.props.sphereId}
              handle={item.handle}
              item={item}
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
              disabled={item.stone.config.disabled || this.viewingRemotely || SetupStateHandler.isSetupInProgress() } // either disabled or remote
              disabledDescription={ SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching: not (yet) seen in the last 30 seconds.' } // either disabled or remote
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
    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stones);

    // add the stoneIds of the Crownstones in setup mode to the list but only if we're in the floating category
    if (SetupStateHandler.areSetupStonesAvailable() === true && this.props.locationId === null) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);
      setupIds.forEach((setupId) => {
        ids.push(setupId);
        setupStones[setupId].setupMode = true;
        stoneArray.push(setupStones[setupId]);
      });
    }

    stoneIds.forEach((stoneId) => {
      ids.push(stoneId);
      stoneArray.push(stones[stoneId]);
    });

    return (
      <SeparatedItemList
        items={stoneArray}
        ids={ids}
        separatorIndent={false}
        renderer={this._renderer.bind(this)}
      />
    )
  }

  render() {
    console.log("redrawing the thing");

    const store = this.props.store;
    const state = store.getState();

    this.seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false && this.seeStoneInSetupMode !== true;

    let usage  = getCurrentPowerUsageFromState(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersFromState(state, this.props.sphereId, this.props.locationId);
    let stones = getRoomContentFromState(state, this.props.sphereId, this.props.locationId);

    let backgroundImage = this.props.getBackground('main', this.viewingRemotely);

    let content = undefined;
    if (Object.keys(stones).length == 0 && this.seeStoneInSetupMode == false) {
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
          <RoomBanner presentUsers={users} usage={usage} floatingCrownstones={this.props.locationId === null} viewingRemotely={this.viewingRemotely} />
          <ScrollView>
            <View style={{height:Math.max(Object.keys(stones).length*85+ 300, screenHeight-tabBarHeight-topBarHeight-100)} /* make sure we fill the screen */}>
              {this.getItems(stones)}
            </View>
          </ScrollView>
        </View>
      );
    }
    return (
      <Background hideTopBar={true} image={backgroundImage}>
        <TopBar
          title={this.props.title}
          right={userIsAdminInSphere(state, this.props.sphereId) && this.props.locationId !== null ? 'Edit' : undefined}
          rightAction={() => { Actions.roomEdit({sphereId: this.props.sphereId, locationId: this.props.locationId})}}
          leftAction={ () => { Actions.pop(); }}
        />
        {content}
      </Background>
    );
  }
}



