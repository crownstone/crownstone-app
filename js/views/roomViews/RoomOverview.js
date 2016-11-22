import React, { Component } from 'react' 
import {
  Alert,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  StyleSheet,
  View
} from 'react-native';


import { SetupStateHandler } from '../../native/SetupStateHandler'
import { stoneTypes } from '../../router/store/reducers/stones'
import { AlternatingContent }   from '../components/animated/AlternatingContent'
import { Background }   from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SetupDeviceEntry } from '../components/SetupDeviceEntry'
import { BleUtil } from '../../native/BleUtil'
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
  getRoomContentFromState,
  enoughCrownstonesForIndoorLocalization
} from '../../util/dataUtil'
import { Icon } from '../components/Icon'
import { Separator } from '../components/Separator'
import { styles, colors, screenWidth, screenHeight, tabBarHeight, topBarHeight } from '../styles'
import { LOG, LOGDebug, LOGError } from '../../logging/Log'


export class RoomOverview extends Component {
  constructor(props) {
    super();
    this.state = {pendingRequests:{}};
    this.unsubscribeSetupEvents = [];

    this.viewingRemotely = true;
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled",   (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress",  (data) => { this.forceUpdate();}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate();}));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupComplete",    (handle) => { this.forceUpdate();}));

    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId]) {
        Actions.pop();
        return;
      }

      if (
        (change.updateApplianceConfig) ||
        (change.updateStoneConfig) ||
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
          <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
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
          <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
            <DeviceEntry
              initiallyOpen={this.props.usedForIndoorLocalizationSetup == true && index == 0}
              eventBus={this.props.eventBus}
              name={item.device.config.name}
              icon={item.device.config.icon}
              state={item.stone.state.state}
              currentUsage={item.stone.config.type !== stoneTypes.guidestone ? item.stone.state.currentUsage : undefined}
              navigation={false}
              control={item.stone.config.type !== stoneTypes.guidestone && this.viewingRemotely === false}
              pending={this.state.pendingRequests[stoneId] !== undefined} // either disabled, pending or remote
              disabled={item.stone.config.disabled || this.viewingRemotely || SetupStateHandler.isSetupInProgress() } // either disabled or remote
              disabledDescription={ SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...' } // either disabled or remote
              dimmable={item.device.config.dimmable}
              showBehaviour={item.stone.config.type !== stoneTypes.guidestone}
              onChange={(switchState) => {
                this.showPending(stoneId);
                let data = {state: switchState};
                if (switchState === 0) {
                  data.currentUsage = 0;
                }
                let proxy = BleUtil.getProxy(item.stone.config.handle);
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

  _getStoneList(stones) {
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

    return {stoneArray, ids};
  }

  _getExplanation(stonesInRoom, seeStoneInSetupMode) {
    let explanation = this.props.explanation;
    if (explanation === undefined && seeStoneInSetupMode === true) {
      explanation = this.props.locationId === null ? "Crownstones in setup mode have a blue icon." : "Crownstone in setup mode found. Check the overview!";
    }
    if (explanation === undefined && !stonesInRoom) {
      explanation = this.props.locationId === null ? "No Crownstones found." : "No Crownstones in this room.";
    }


    if (explanation === undefined) {
      return <View />
    }

    return (
      <View style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}}>
        <View style={{flexDirection: 'column', padding:10}}>
          <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
        </View>
      </View>
    )
  }


  /**
   * The right item is the flickering icon for localization.
   * @param state
   * @param userAdmin
   * @returns {XML}
   */
  getRightItem(state, userAdmin) {
    if (userAdmin === true && this.props.locationId !== null && this.props.viewingRemotely !== true) {
      let canDoLocalization = enoughCrownstonesForIndoorLocalization(state, this.props.sphereId);
      let showFingerprintNeeded = false;
      if (canDoLocalization === true && state.spheres[this.props.sphereId].locations[this.props.locationId].config.fingerprintRaw === null) {
        showFingerprintNeeded = true;
      }
      if (showFingerprintNeeded === true) {
        let iconSize = 25;
        return (
          <AlternatingContent
            style={{flex:1, width:60, height:42, justifyContent:'center', alignItems:'flex-end'}}
            fadeDuration={500}
            switchDuration={2000}
            contentArray={[
              <View style={[styles.centered, {
                width:iconSize,
                height:iconSize, borderRadius:iconSize*0.5,
                borderWidth:2,
                borderColor:'#fff',
                backgroundColor:colors.iosBlue.hex}]} >
                <Icon name="c1-locationPin1" color="#fff" size={15} style={{backgroundColor:'transparent'}} />
              </View>,
              <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.rightStyle]}>Edit</Text>
            ]} />
        )
      }
    }
  }

  render() {
    console.log("RENDERING ROOM OVERVIEW")

    const store = this.props.store;
    const state = store.getState();

    let title = undefined;
    if (this.props.locationId !== null) {
      title = state.spheres[this.props.sphereId].locations[this.props.locationId].config.name;
    }
    else {
      title = "Floating Crownstones"
    }

    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false && seeStoneInSetupMode !== true;
    // this.viewingRemotely = false; // used for development: forcing remote off

    let usage  = getCurrentPowerUsageFromState(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersFromState(state, this.props.sphereId, this.props.locationId);
    let stones = getRoomContentFromState(state, this.props.sphereId, this.props.locationId);
    let userAdmin = userIsAdminInSphere(state, this.props.sphereId);

    let stonesInRoom = Object.keys(stones).length > 0;
    let backgroundImage = this.props.getBackground('main', this.viewingRemotely);

    if (this.props.usedForIndoorLocalizationSetup === true) {
      if (!stonesInRoom) {
        setTimeout(() => {
          Actions.pop();
          this.props.eventBus.emit("showLocalizationSetupStep2", this.props.sphereId)
        }, 100);
      }
    }

    let content = undefined;
    if (!stonesInRoom && seeStoneInSetupMode == false) {
      content = (
        <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
          <Icon name="c2-pluginFront" size={0.75 * screenWidth} color="#fff" style={{backgroundColor:'transparent'}} />
        </View>
      );
    }
    else {
      let {stoneArray, ids} = this._getStoneList(stones);
      content = (
        <View>
          <ScrollView style={{position:'relative', top:-1}}>
            <View style={{height:Math.max(Object.keys(stoneArray).length*85+ 300, screenHeight-tabBarHeight-topBarHeight-100)} /* make sure we fill the screen */}>
              {this.renderStones(stoneArray, ids)}
            </View>
          </ScrollView>
        </View>
      );
    }

    return (
      <Background hideTopBar={true} image={backgroundImage}>
        <TopBar
          title={title}
          right={userAdmin === true && this.props.locationId !== null ? 'Edit' : undefined}
          rightItem={this.getRightItem(state, userAdmin)}
          rightAction={() => { Actions.roomEdit({sphereId: this.props.sphereId, locationId: this.props.locationId})}}
          leftAction={ () => { Actions.pop(); }}
        />
        <RoomBanner
          presentUsers={users}
          noCrownstones={!stonesInRoom}
          hideRight={this.props.hideRight}
          usage={usage}
          floatingCrownstones={this.props.locationId === null}
          viewingRemotely={this.viewingRemotely}
          overlayText={this.props.overlayText}
        />
        {this._getExplanation(stonesInRoom, seeStoneInSetupMode)}
        {content}
      </Background>
    );
  }

  renderStones(stoneArray, ids) {
    return (
      <SeparatedItemList
        items={stoneArray}
        ids={ids}
        separatorIndent={false}
        renderer={this._renderer.bind(this)}
      />
    )
  }
}

export const topBarStyle = StyleSheet.create({
  topBar: {
    backgroundColor: colors.menuBackground.hex,
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row'
  },
  topBarSideView: {
    justifyContent: 'center',
    width: 60, // TODO: make dynamic
  },
  topBarCenterView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarLeft: {
    textAlign: 'left',
  },
  topBarCenter: {
    textAlign: 'center',
  },
  topBarRight: {
    textAlign: 'right',
  },
  titleText: {
    fontSize: 18,
    color: 'white'
  },
  text:{
    fontSize: 17,
    color: colors.iosBlue.hex
  }
});


