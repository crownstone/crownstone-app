import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

import { SetupStateHandler }    from '../../native/setup/SetupStateHandler'
import { STONE_TYPES }           from '../../router/store/reducers/stones'
import { AlternatingContent }   from '../components/animated/AlternatingContent'
import { Background }           from '../components/Background'
import { DeviceEntry }          from '../components/deviceEntries/DeviceEntry'
import { SetupDeviceEntry }     from '../components/deviceEntries/SetupDeviceEntry'
import { BatchCommandHandler }  from '../../logic/BatchCommandHandler'
import { INTENTS }              from '../../native/libInterface/Constants'
import { TopBar }               from '../components/Topbar'
import { SeparatedItemList }    from '../components/SeparatedItemList'
import { RoomBanner }           from '../components/RoomBanner'
import { Util }                 from '../../util/Util'
import { Icon }                 from '../components/Icon'
const Actions = require('react-native-router-flux').Actions;
import {
  getPresentUsersInLocation,
  getCurrentPowerUsageInLocation,
  getStonesAndAppliancesInLocation,
  enoughCrownstonesInLocationsForIndoorLocalization,
  canUseIndoorLocalizationInSphere,
  getFloatingStones, enoughCrownstonesForIndoorLocalization
} from '../../util/DataUtil'
import { styles, colors, screenWidth, screenHeight, tabBarHeight, topBarHeight } from '../styles'
import {DfuStateHandler} from '../../native/firmware/DfuStateHandler';
import {DfuDeviceEntry}  from '../components/deviceEntries/DfuDeviceEntry';
import {RoomExplanation} from '../components/RoomExplanation';
import {RoomBottomExplanation} from "../components/RoomBottomExplanation";
import {Permissions} from "../../backgroundProcesses/PermissionManager";


export class RoomOverview extends Component<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;
  viewingRemotely : boolean;
  justFinishedSetup : any;
  nearestStoneIdInSphere : any;
  nearestStoneIdInRoom : any;

  constructor() {
    super();
    this.state = {pendingRequests:{}, scrollViewHeight: new Animated.Value(screenHeight-tabBarHeight-topBarHeight-100)};
    this.unsubscribeSetupEvents = [];

    this.viewingRemotely = true;
    this.justFinishedSetup = "";

    this.nearestStoneIdInSphere = undefined;
    this.nearestStoneIdInRoom = undefined;

  }

  componentWillMount() {
    let state = this.props.store.getState();
    let stonesInRoom = getStonesAndAppliancesInLocation(state, this.props.sphereId, this.props.locationId);
    let {stoneArray, ids} = this._getStoneList(stonesInRoom);
    if (SetupStateHandler.areSetupStonesAvailable()) {
      if (stoneArray.length === 0) {
        this.state.scrollViewHeight.setValue(screenHeight - tabBarHeight - topBarHeight - 100 - 60 - 60);
      }
      else {
        this.state.scrollViewHeight.setValue(screenHeight - tabBarHeight - topBarHeight - 100 - 60);
      }
    }
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled",   (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress",  (data)   => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStonesDetected", () => {
      Animated.spring(this.state.scrollViewHeight, { toValue: screenHeight-tabBarHeight-topBarHeight-160, friction: 7, tension: 70 }).start();
    }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("noSetupStonesVisible", () => {
      Animated.timing(this.state.scrollViewHeight, { toValue: screenHeight-tabBarHeight-topBarHeight-100, duration: 250 }).start();
    }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("dfuStoneChange", (handle) => { this.forceUpdate(); }));
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
    if (item.dfuMode === true) {
      return (
        <View key={stoneId + '_dfu_entry'}>
        <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <DfuDeviceEntry
            key={stoneId + '_dfu_element'}
            eventBus={this.props.eventBus}
            store={this.props.store}
            sphereId={this.props.sphereId}
            handle={item.advertisement && item.advertisement.handle}
            name={item.data && item.data.name}
            stoneId={item.data && item.data.id}
          />
        </View>
      </View>
      )
    }
    else if (item.setupMode === true && item.handle) {
      return (
        <View key={stoneId + '_setup_entry'}>
          <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
            <SetupDeviceEntry
              key={stoneId + '_setup_element'}
              eventBus={this.props.eventBus}
              store={this.props.store}
              sphereId={this.props.sphereId}
              handle={item.handle}
              item={item}
            />
          </View>
        </View>
      );
    }
    else {
      return (
        <View key={stoneId + '_entry'}>
          <DeviceEntry
            initiallyOpen={this.justFinishedSetup === item.stone.config.handle || (this.props.usedForIndoorLocalizationSetup == true && index == 0)}
            eventBus={this.props.eventBus}
            store={this.props.store}
            stoneId={stoneId}
            locationId={this.props.locationId}
            sphereId={this.props.sphereId}
            viewingRemotely={this.viewingRemotely}
            nearestInSphere={stoneId === this.nearestStoneIdInSphere}
            nearestInRoom={stoneId === this.nearestStoneIdInRoom}
          />
        </View>
      );
    }
  }

  _getStoneList(stones) {
    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};


    if (DfuStateHandler.areDfuStonesAvailable() === true) {
      let dfuStones = DfuStateHandler.getDfuStones();
      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        shownHandles[dfuStones[dfuId].advertisement.handle] = true;
        ids.push(dfuId);
        dfuStones[dfuId].dfuMode = true;
        stoneArray.push(dfuStones[dfuId]);
      });
    }

    // add the stoneIds of the Crownstones in setup mode to the list but only if we're in the floating category
    if (SetupStateHandler.areSetupStonesAvailable() === true && this.props.locationId === null) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);
      setupIds.forEach((setupId) => {
        if (shownHandles[setupStones[setupId].handle] === undefined) {
          ids.push(setupId);
          shownHandles[setupStones[setupId].handle] = true;
          setupStones[setupId].setupMode = true;
          stoneArray.push(setupStones[setupId]);
        }
      });
    }

    stoneIds.forEach((stoneId) => {
      // do not show the same device twice
      let handle = stones[stoneId].stone.config.handle;
      if (shownHandles[handle] === undefined) {
        ids.push(stoneId);
        stoneArray.push(stones[stoneId]);
      }
    });

    return { stoneArray, ids };
  }

  /**
   * The right item is the flickering icon for localization.
   * @param state
   * @param enoughCrownstones
   * @param label
   */
  _getRightItem(state, enoughCrownstones, label) {
    if (!state.app.indoorLocalizationEnabled) { return; } // do not show localization if it is disabled
    if (this.props.locationId === null)       { return; } // floating crownstones do not have settings
    if (this.viewingRemotely === true)        { return; } // cant train a room when not in the sphere
    if (!enoughCrownstones)                   { return; } // not enough crownstones to train this room

    let location = state.spheres[this.props.sphereId].locations[this.props.locationId];
    if (location.config.fingerPrintRaw !== null) { return; } // there already is a fingerprint, dont show animated training icon.

    // this will show a one-time popup for localization
    if (state.user.seenRoomFingerprintAlert !== true) {
      let aiName = state.spheres[this.props.sphereId].config.aiName;
      this.props.store.dispatch({type: 'USER_SEEN_ROOM_FINGERPRINT_ALERT', data: {seenRoomFingerprintAlert: true}});
      Alert.alert(
        "Lets teach " + aiName + " how to identify this room!",
        "Tap the flashing icon in the top right corner to go the edit menu and tap the button 'Teach " + aiName + " to find you!'.",
        [{text: "OK"}]
      );
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
          <Text style={[topBarStyle.topBarRight, topBarStyle.text, this.props.rightStyle]}>{ label }</Text>
        ]} />
    );
  }

  _getTopBar(state) {
    let title = undefined;
    let enoughCrownstones = enoughCrownstonesForIndoorLocalization(state, this.props.sphereId);
    if (this.props.locationId !== null) {
      title = state.spheres[this.props.sphereId].locations[this.props.locationId].config.name;
    }
    else {
      title = "Floating Crownstones";
    }

    let rightLabel = undefined;
    let rightAction = () => { };
    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    if (spherePermissions.editRoom === true && this.props.locationId !== null) {
      rightLabel = 'Edit';
      rightAction = () => { Actions.roomEdit({sphereId: this.props.sphereId, locationId: this.props.locationId}); };
    }
    else if (spherePermissions.editRoom === false && this.props.locationId !== null && enoughCrownstones === true) {
      rightLabel = 'Train';
      rightAction = () => {
        if (this.viewingRemotely === true) {
          Alert.alert("You're not in the Sphere", "Training is only possible if you're in the Sphere. Try again when you are.", [{text:"OK"}])
        }
        else {
          Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId});
        }
      };
    }

    return (
      <TopBar
        title={ title }
        right={ rightLabel }
        rightItem={ this._getRightItem(state, enoughCrownstones, rightLabel) }
        rightAction={ rightAction }
        leftAction={ () => { Actions.pop(); }}
      />
    );
  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    let seeStoneInDfuMode = DfuStateHandler.areDfuStonesAvailable();
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false && seeStoneInSetupMode !== true && seeStoneInDfuMode !== true;

    let usage  = getCurrentPowerUsageInLocation(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersInLocation(state, this.props.sphereId, this.props.locationId);
    let stones = getStonesAndAppliancesInLocation(state, this.props.sphereId, this.props.locationId);
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
      this._setNearestStoneInRoom(stoneArray, ids);
      this._setNearestStoneInSphere(state.spheres[this.props.sphereId].stones);
      content = (
        <Animated.View style={{height: this.state.scrollViewHeight}}>
          <ScrollView style={{position:'relative', top:-1}}>
            <View style={{height: Math.max(Object.keys(stoneArray).length*85+200, screenHeight-tabBarHeight-topBarHeight-100)} /* make sure we fill the screen */}>
              <SeparatedItemList
                items={stoneArray}
                ids={ids}
                separatorIndent={false}
                renderer={this._renderer.bind(this)}
              />
            </View>
          </ScrollView>
        </Animated.View>
      );
    }

    return (
      <Background hideTopBar={true} image={backgroundImage}>
        { this._getTopBar(state) }
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
        <RoomExplanation
          state={state}
          explanation={ this.props.explanation }
          sphereId={ this.props.sphereId }
          locationId={ this.props.locationId }
        />
        {content}
        <RoomBottomExplanation
          sphereId={ this.props.sphereId }
          locationId={ this.props.locationId }
        />
      </Background>
    );
  }

  _setNearestStoneInRoom(stoneArray, ids) {
    let rssi = -1000;
    for (let i = 0; i < stoneArray.length; i++) {
      let stone = stoneArray[i].stone;
      if (stone && stone.config && stone.config.rssi && rssi < stone.config.rssi && stone.config.disabled === false) {
        rssi = stone.config.rssi;
        this.nearestStoneIdInRoom = ids[i];
      }
    }
  }

  _setNearestStoneInSphere(allStones) {
    let rssi = -1000;
    let stoneIds = Object.keys(allStones);
    for (let i = 0; i < stoneIds.length; i++) {
      let stone = allStones[stoneIds[i]];
      if (stone && stone.config && stone.config.rssi && rssi < stone.config.rssi && stone.config.disabled === false) {
        rssi = stone.config.rssi;
        this.nearestStoneIdInSphere = stoneIds[i];
      }
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


