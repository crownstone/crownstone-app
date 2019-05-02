
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  Text,
  View
} from 'react-native';

import { AlternatingContent }   from '../components/animated/AlternatingContent'
import { Background }           from '../components/Background'
import { DeviceEntry }          from '../components/deviceEntries/DeviceEntry'
import { BatchCommandHandler }  from '../../logic/BatchCommandHandler'
import { SeparatedItemList }    from '../components/SeparatedItemList'
import { RoomBanner }           from '../components/RoomBanner'
import { Icon }                 from '../components/Icon'

import {
  getPresentUsersInLocation,
  getCurrentPowerUsageInLocation,
  getStonesAndAppliancesInLocation,
  canUseIndoorLocalizationInSphere,
  enoughCrownstonesInLocationsForIndoorLocalization, DataUtil
} from "../../util/DataUtil";
import { styles, colors, screenHeight, tabBarHeight, topBarHeight, } from '../styles'
import { DfuStateHandler }        from '../../native/firmware/DfuStateHandler';
import { DfuDeviceEntry }         from '../components/deviceEntries/DfuDeviceEntry';
import { RoomExplanation }        from '../components/RoomExplanation';
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { TopbarButton }           from "../components/topbar/TopbarButton";
import { SphereDeleted }          from "../static/SphereDeleted";
import { RoomDeleted }            from "../static/RoomDeleted";
import { preparePictureURI }      from "../../util/Util";
import { topBarStyle }            from "../components/topbar/TopbarStyles";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";


export class RoomOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    let paramsToUse = params;
    if (!params.title) {
      if (NAVBAR_PARAMS_CACHE !== null) {
        paramsToUse = NAVBAR_PARAMS_CACHE;
      }
      else {
        paramsToUse = getNavBarParams(core.store.getState(), params, true);
      }
    }

    return {
      title: paramsToUse.title,
      headerRight: <TopbarButton text={paramsToUse.rightLabel} onPress={paramsToUse.rightAction} item={paramsToUse.rightItem}/>,
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;
  viewingRemotely : boolean;
  viewingRemotelyInitial : boolean;
  justFinishedSetup : any;
  pictureTaken : any = null;
  nearestStoneIdInSphere : any;
  nearestStoneIdInRoom : any;

  constructor(props) {
    super(props);

    let initialState = {pendingRequests:{}};
    this.unsubscribeSetupEvents = [];

    this.viewingRemotely = true;
    this.justFinishedSetup = "";

    this.nearestStoneIdInSphere = undefined;
    this.nearestStoneIdInRoom = undefined;

    let state = core.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (sphere) {
      this.viewingRemotely = sphere.state.present === false;
    }

    this.state = initialState;

    this.viewingRemotelyInitial = this.viewingRemotely;

    this._updateNavBar();
  }

  componentDidMount() {
    this.unsubscribeSetupEvents.push(core.eventBus.on("dfuStoneChange", (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupComplete",    (handle) => {
      this.forceUpdate();
    }));

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId] ||
          change.removeSphere   && change.removeSphere.sphereIds[this.props.sphereId]) {
        if (this.props.navigation.state.routeName === "RoomOverview") {
          this.forceUpdate()
        }
        return;
      }

      if (
        (change.updateApplianceConfig) ||
        (change.updateStoneConfig)     ||
        (change.changeFingerprint)     ||
        (change.changeSphereUsers      && change.changeSphereUsers.sphereIds[this.props.sphereId])     ||
        (change.stoneRssiUpdated       && change.stoneRssiUpdated.sphereIds[this.props.sphereId])      ||
        (change.stoneUsageUpdated      && change.stoneUsageUpdated.sphereIds[this.props.sphereId])     ||
        (change.changeSphereState      && change.changeSphereState.sphereIds[this.props.sphereId])     ||
        (change.changeStoneState       && change.changeStoneState.sphereIds[this.props.sphereId])      ||
        (change.stoneLocationUpdated   && change.stoneLocationUpdated.sphereIds[this.props.sphereId])  ||
        (change.changeStones)
      ) {
        this.forceUpdate();
        this._updateNavBar();
        return;
      }

      // actions specifically for location that are not floating
      if (this.props.locationId !== null) {
        if (
          (change.userPositionUpdate   && change.userPositionUpdate.locationIds[this.props.locationId])   ||
          (change.updateLocationConfig && change.updateLocationConfig.locationIds[this.props.locationId])
        ) {
          this.forceUpdate();
          this._updateNavBar();
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();

    // we keep open a connection for a few seconds to await a second command
    BatchCommandHandler.closeKeptOpenConnection();
    NAVBAR_PARAMS_CACHE = null;
  }

  _renderer(item, index, stoneId) {
    if (item.dfuMode === true) {
      return (
        <View key={stoneId + '_dfu_entry'}>
        <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <DfuDeviceEntry
            key={stoneId + '_dfu_element'}
            sphereId={this.props.sphereId}
            handle={item.advertisement && item.advertisement.handle}
            name={item.data && item.data.name}
            stoneId={item.data && item.data.id}
          />
        </View>
      </View>
      )
    }
    else {
      return (
        <View key={stoneId + '_entry'}>
          <DeviceEntry
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


    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();
      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        shownHandles[dfuStones[dfuId].advertisement.handle] = true;
        ids.push(dfuId);
        dfuStones[dfuId].dfuMode = true;
        stoneArray.push(dfuStones[dfuId]);
      });
    }


    let tempStoneDataArray = [];
    stoneIds.forEach((stoneId) => {
      // do not show the same device twice
      let handle = stones[stoneId].stone.config.handle;
      if (shownHandles[handle] === undefined) {
        tempStoneDataArray.push({stone: stones[stoneId], id: stoneId});
      }
    });

    // sort the order of things by crownstone Id
    tempStoneDataArray.sort((a,b) => { return a.stone.stone.config.crownstoneId - b.stone.stone.config.crownstoneId });

    tempStoneDataArray.forEach((stoneData) => {
      ids.push(stoneData.id);
      stoneArray.push(stoneData.stone);
    });

    return { stoneArray, ids };
  }


  _updateNavBar() {
    let state = core.store.getState();
    let params = getNavBarParams(state, this.props, this.viewingRemotely);
    this.props.navigation.setParams(params);
  }


  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted/> }
    let location = null;

    if (this.props.locationId) {
      location = sphere.locations[this.props.locationId];
      if (!location) {
        return <RoomDeleted/>
      }
    }

    let seeStoneInDfuMode = DfuStateHandler.areDfuStonesAvailable();

    let usage  = getCurrentPowerUsageInLocation(state, this.props.sphereId, this.props.locationId);
    let users  = getPresentUsersInLocation(state, this.props.sphereId, this.props.locationId);
    let stones = getStonesAndAppliancesInLocation(state, this.props.sphereId, this.props.locationId);
    let canDoLocalization = canUseIndoorLocalizationInSphere(state, this.props.sphereId);

    // if we're the only crownstone and in the floating crownstones overview, assume we're always present.
    this.viewingRemotely = sphere.state.present === false && seeStoneInDfuMode !== true;

    let backgroundImage = core.background.light;

    if (this.props.locationId) {
      if (location.config.picture) {
        backgroundImage = { uri: preparePictureURI(location.config.picture) };
      }
    }

    let amountOfStonesInRoom = Object.keys(stones).length;
    let content = undefined;
    if (amountOfStonesInRoom > 0) {
      let {stoneArray, ids} = this._getStoneList(stones);
      this._setNearestStoneInRoom(stoneArray, ids);
      this._setNearestStoneInSphere(state.spheres[this.props.sphereId].stones);
      let viewHeight = screenHeight-tabBarHeight-topBarHeight-100;

      content = (
        <ScrollView style={{position:'relative', top:-1}}>
          <View style={{height: Math.max(stoneArray.length*81 + 0.5*viewHeight, viewHeight)} /* make sure we fill the screen */}>
            <SeparatedItemList
              items={stoneArray}
              ids={ids}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
          </View>
        </ScrollView>
      );
    }

    return (
      <Background image={backgroundImage}>
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
      </Background>
    );
  }

  _setNearestStoneInRoom(stoneArray, ids) {
    let rssi = -1000;
    for (let i = 0; i < stoneArray.length; i++) {
      let stone = stoneArray[i].stone;
      if (stone && stone.reachability && stone.reachability.rssi && rssi < stone.reachability.rssi && stone.reachability.disabled === false) {
        rssi = stone.reachability.rssi;
        this.nearestStoneIdInRoom = ids[i];
      }
    }
  }

  _setNearestStoneInSphere(allStones) {
    let rssi = -1000;
    let stoneIds = Object.keys(allStones);
    for (let i = 0; i < stoneIds.length; i++) {
      let stone = allStones[stoneIds[i]];
      if (stone && stone.reachability && stone.reachability.rssi && rssi < stone.reachability.rssi && stone.reachability.disabled === false) {
        rssi = stone.reachability.rssi;
        this.nearestStoneIdInSphere = stoneIds[i];
      }
    }
  }
}


/**
 * The right item is the flickering icon for localization.
 * @param state
 * @param enoughCrownstonesInLocations
 * @param label
 */
function getNavBarRightItem(state, enoughCrownstonesInLocations, label, props, viewingRemotely) {
  if (!state.app.indoorLocalizationEnabled) { return; } // do not show localization if it is disabled
  if (props.locationId === null)            { return; } // floating crownstones do not have settings
  if (viewingRemotely === true)             { return; } // cant train a room when not in the sphere
  if (!enoughCrownstonesInLocations)                   { return; } // not enough crownstones to train this room

  let location = state.spheres[props.sphereId].locations[props.locationId];
  if (location.config.fingerprintRaw !== null) { return; } // there already is a fingerprint, dont show animated training icon.

  // this will show a one-time popup for localization
  if (state.user.seenRoomFingerprintAlert !== true) {
    let aiData = DataUtil.getAiData(state, props.sphereId);
    core.store.dispatch({type: 'USER_SEEN_ROOM_FINGERPRINT_ALERT', data: {seenRoomFingerprintAlert: true}});
    Alert.alert(
lang("_Lets_teach_____arguments_header",aiData.name),
lang("_Lets_teach_____arguments_body",aiData.name),
[{text: lang("_Lets_teach_____arguments_left")}]
    );
  }
  let iconSize = 25;
  return (
    <AlternatingContent
      style={{width:60, height:42, justifyContent:'center', alignItems:'flex-end'}}
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
        <Text style={[topBarStyle.text, props.rightStyle]}>{ label }</Text>
      ]} />
  );
}

function getNavBarParams(state, props, viewingRemotely) {
  let title = undefined;
  let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(state, props.sphereId);
  if (props.locationId !== null) {
    title = state.spheres[props.sphereId].locations[props.locationId].config.name;
  }
  else {
    title =  lang("Floating");
  }

  let rightLabel = undefined;
  let rightAction = () => { };
  let spherePermissions = Permissions.inSphere(props.sphereId);

  if (spherePermissions.editRoom === true && props.locationId !== null) {
    rightLabel =  lang("Edit");
    rightAction = () => {
      NavigationUtil.navigate("RoomEdit",{ sphereId: props.sphereId, locationId: props.locationId });
    };
  }
  else if (spherePermissions.editRoom === false && props.locationId !== null && enoughCrownstonesInLocations === true) {
    rightLabel =  lang("Train");
    rightAction = () => {
      if (viewingRemotely === true) {
        Alert.alert(
          lang("_Youre_not_in_the_Sphere__header"),
          lang("_Youre_not_in_the_Sphere__body"),
          [{text:lang("_Youre_not_in_the_Sphere__left")}])
      }
      else {
        NavigationUtil.navigate("RoomTraining_roomSize",{ sphereId: props.sphereId, locationId: props.locationId });
      }
    };
  }

  NAVBAR_PARAMS_CACHE = {title: title, rightItem: getNavBarRightItem(state, enoughCrownstonesInLocations, rightLabel, props, viewingRemotely), rightAction: rightAction, rightLabel: rightLabel};
  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE = null;
