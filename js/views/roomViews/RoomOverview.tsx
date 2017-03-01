import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

import { SetupStateHandler } from '../../native/SetupStateHandler'
import { stoneTypes } from '../../router/store/reducers/stones'
import { AlternatingContent }   from '../components/animated/AlternatingContent'
import { Background }   from '../components/Background'
import { DeviceEntry } from '../components/DeviceEntry'
import { SetupDeviceEntry } from '../components/SetupDeviceEntry'
import { BleUtil, BatchCommand } from '../../native/BleUtil'
import { BluenetPromises, INTENTS } from '../../native/Proxy'
import { TopBar } from '../components/Topbar'
import { SeparatedItemList } from '../components/SeparatedItemList'
import { RoomBanner }  from '../components/RoomBanner'
import { getUserLevelInSphere } from '../../util/DataUtil'
import { Util } from '../../util/Util'
const Actions = require('react-native-router-flux').Actions;
import { 
  getPresentUsersInLocation,
  getCurrentPowerUsageInLocation,
  getStonesAndAppliancesInLocation,
  enoughCrownstonesInLocationsForIndoorLocalization,
  canUseIndoorLocalizationInSphere,
  getFloatingStones
} from '../../util/DataUtil'
import { Icon } from '../components/Icon'
import { styles, colors, screenWidth, screenHeight, tabBarHeight, topBarHeight } from '../styles'
import { LOG } from '../../logging/Log'


export class RoomOverview extends Component<any, any> {
  tapToToggleCalibration : any;
  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;
  viewingRemotely : boolean;
  justFinishedSetup : any;
  nearestStoneId : any;

  constructor() {
    super();
    this.state = {pendingRequests:{}};
    this.unsubscribeSetupEvents = [];

    this.viewingRemotely = true;
    this.justFinishedSetup = "";

    this.nearestStoneId = undefined;
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled",   (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress",  (data)   => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupComplete",    (handle) => {
      this.justFinishedSetup = handle;
      this.forceUpdate();
    }));

    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId]) {
        Actions.pop();
        return;
      }

      if (
        (change.updateApplianceConfig)  ||
        (change.updateStoneConfig)      ||
        (change.changeFingerprint)      ||
        (change.stoneRssiUpdated  && change.stoneRssiUpdated.sphereIds[this.props.sphereId]) ||
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
              initiallyOpen={this.justFinishedSetup === item.stone.config.handle || this.props.usedForIndoorLocalizationSetup == true && index == 0}
              eventBus={this.props.eventBus}
              name={item.device.config.name}
              icon={item.device.config.icon}
              state={item.stone.state.state}
              currentUsage={item.stone.config.type !== stoneTypes.guidestone ? item.stone.state.currentUsage : undefined}
              navigation={false}
              tapToToggleCalibration={this.tapToToggleCalibration}
              control={item.stone.config.type !== stoneTypes.guidestone && this.viewingRemotely === false}
              pending={this.state.pendingRequests[stoneId] !== undefined} // either disabled, pending or remote
              disabled={item.stone.config.disabled || this.viewingRemotely || SetupStateHandler.isSetupInProgress() } // either disabled or remote
              disabledDescription={ SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...' } // either disabled or remote
              dimmable={item.device.config.dimmable}
              showBehaviour={item.stone.config.type !== stoneTypes.guidestone}
              rssi={item.stone.config.rssi}
              nearest={stoneId === this.nearestStoneId}
              onChange={(switchState) => {
                this.showPending(stoneId);
                let data = {state: switchState};
                if (switchState === 0) {
                  data["currentUsage"] = 0;
                }

                let bleController = new BatchCommand(this.props.store, this.props.sphereId);
                bleController.load(item.stone, stoneId, 'setSwitchState', [switchState, 0, INTENTS.manual]).catch((err) => {});
                bleController.execute({}, true)
                  .then(() => {
                    this.props.store.dispatch({
                      type: 'UPDATE_STONE_SWITCH_STATE',
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
              onMove={() => {
                Actions.pop();
                (Actions as any).roomSelection({sphereId: this.props.sphereId, stoneId: stoneId, locationId: this.props.locationId, viewingRemotely: this.viewingRemotely});
              }}
              onChangeType={() => { (Actions as any).deviceEdit({sphereId: this.props.sphereId, stoneId: stoneId, viewingRemotely: this.viewingRemotely})}}
              onChangeSettings={() => { (Actions as any).deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: stoneId, viewingRemotely: this.viewingRemotely})}}
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

  /**
   * The right item is the flickering icon for localization.
   * @param state
   * @param userAdmin
   * @returns {XML}
   */
  getRightItem(state, userAdmin) {
    if (userAdmin === true && this.props.locationId !== null && this.viewingRemotely !== true) {
      let canDoLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
      let showFingerprintNeeded = false;
      if (canDoLocalization === true && state.spheres[this.props.sphereId].locations[this.props.locationId].config.fingerprintRaw === null) {
        showFingerprintNeeded = true;
      }
      if (showFingerprintNeeded === true) {
        if (state.user.seenRoomFingerprintAlert !== true) {
          let aiName = state.spheres[this.props.sphereId].config.aiName;
          this.props.store.dispatch({type: 'USER_SEEN_ROOM_FINGERPRINT_ALERT', data: {seenRoomFingerprintAlert: true}});
          Alert.alert("Lets teach " + aiName + " how to identify this room!",
            "Tap the flashing icon in the top right corner to go the edit menu and tap the button 'Teach " + aiName + " to find you!'.",
            [{text: "OK"}])
        }

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
    const store = this.props.store;
    const state = store.getState();
    this.tapToToggleCalibration = Util.data.getTapToToggleCalibration(state);

    let title = undefined;
    if (this.props.locationId !== null) {
      title = state.spheres[this.props.sphereId].locations[this.props.locationId].config.name;
    }
    else {
      title = "Floating Crownstones"
    }

    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false && seeStoneInSetupMode !== true;

    let usage  = getCurrentPowerUsageInLocation(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersInLocation(state, this.props.sphereId, this.props.locationId);
    let stones = getStonesAndAppliancesInLocation(state, this.props.sphereId, this.props.locationId);
    let userAdmin = getUserLevelInSphere(state, this.props.sphereId) === 'admin';
    let canDoLocalization = canUseIndoorLocalizationInSphere(state, this.props.sphereId);

    // if we're the only crownstone and in the floating crownstones overview, assume we're always present.
    this.viewingRemotely = this.props.locationId === null && Object.keys(stones).length === 0 ? false : this.viewingRemotely;

    let amountOfStonesInRoom = Object.keys(stones).length;
    let backgroundImage = this.props.getBackground('main', this.viewingRemotely);

    let content = undefined;
    if (amountOfStonesInRoom === 0 && seeStoneInSetupMode == false) {
      content = undefined;
    }
    else {
      let {stoneArray, ids} = this._getStoneList(stones);
      this._getNearestStoneInRoom(stoneArray, ids);

      content = (
        <View>
          <ScrollView style={{position:'relative', top:-1}}>
            <View style={{height: Math.max(Object.keys(stoneArray).length*85+ 300, screenHeight-tabBarHeight-topBarHeight-100)} /* make sure we fill the screen */}>
              <SeparatedItemList
                items={stoneArray}
                ids={ids}
                separatorIndent={false}
                renderer={this._renderer.bind(this)}
              />
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
          rightAction={() => { (Actions as any).roomEdit({sphereId: this.props.sphereId, locationId: this.props.locationId})}}
          leftAction={ () => { Actions.pop({refresh: {test:true }}); }}
          showHamburgerMenu={true}
        />
        <RoomBanner
          presentUsers={users}
          noCrownstones={amountOfStonesInRoom === 0}
          canDoLocalization={canDoLocalization}
          amountOfStonesInRoom={amountOfStonesInRoom}
          hideRight={this.props.hideRight}
          usage={usage}
          floatingCrownstones={this.props.locationId === null}
          viewingRemotely={this.viewingRemotely}
          overlayText={this.props.overlayText}
        />
        <RoomOverviewExplanation
          state={state}
          explanation={ this.props.explanation }
          sphereId={ this.props.sphereId }
          locationId={ this.props.locationId }
        />
        {content}
      </Background>
    );
  }

  _getNearestStoneInRoom(stoneArray, ids) {
    let rssi = -1000;
    for (let i = 0; i < stoneArray.length; i++) {
      let stone = stoneArray[i].stone;
      if (stone && stone.config && stone.config.rssi && rssi < stone.config.rssi && stone.config.disabled === false) {
        rssi = stone.config.rssi;
        this.nearestStoneId = ids[i];
      }
    }
  }
}


/**
 * This element contains all logic to show the explanation bar in the room overview.
 * It requires:
 *  - {object} state
 *  - {string | undefined} explanation
 *  - {string} sphereId
 *  - {string} locationId
 */
class RoomOverviewExplanation extends Component<any, any> {
  render() {
    let state = this.props.state;
    let sphereId = this.props.sphereId;
    let locationId = this.props.locationId;
    let explanation = this.props.explanation;

    // check if we have special cases
    let amountOfStonesInRoom = Object.keys(getStonesAndAppliancesInLocation(state, sphereId, locationId)).length;
    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    // callback to go to the floating crownstones. Is used twice
    let goToFloatingCrownstonesCallback = () => { Actions.pop(); setTimeout(() => { (Actions as any).roomOverview({sphereId: sphereId, locationId: null}) }, 150)};

    // In case we see a crownstone in setup mode:
    if (explanation === undefined && seeStoneInSetupMode === true) {
      // in floating Crownstones
      if (locationId === null) {
        explanation = "Crownstones in setup mode have a blue icon."
      }
      // Go to the crownstone in setup mode.
      else {
        explanation = "Crownstone in setup mode found. Tap here to see it!";
        buttonCallback = goToFloatingCrownstonesCallback;
      }
    }
    // in case there are no crownstones in the room.
    else if (explanation === undefined && amountOfStonesInRoom === 0) {
      // in floating Crownstones
      if (locationId === null) {
        explanation = "No Crownstones found."
      }
      // there are no crownstones in the sphere
      else if (Object.keys(state.spheres[sphereId].stones).length === 0) {
        explanation = "To add a Crownstones to your sphere, hold your phone really close to a new one!"
      }
      // there are floating crownstones
      else if (getFloatingStones(state, sphereId).length > 0) {
        explanation = "Tap here to see all Crownstones without rooms!";
        buttonCallback = goToFloatingCrownstonesCallback;
      }
      else {
        explanation = "No Crownstones in this room.";
      }
    }


    if (explanation === undefined) {
      return <View />
    }
    else if (buttonCallback !== undefined) {
      return (
        <TouchableOpacity style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}} onPress={buttonCallback}>
          <View style={{flexDirection: 'column', padding:10}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
          </View>
        </TouchableOpacity>
      )
    }
    else {
      return (
        <View style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}}>
          <View style={{flexDirection: 'column', padding:10}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
          </View>
        </View>
      )
    }
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


