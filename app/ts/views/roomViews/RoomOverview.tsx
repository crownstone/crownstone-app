import {Languages} from "../../Languages"
import * as React from 'react';
import {Alert, Image, ScrollView, Text, View} from "react-native";

import {DeviceEntry} from '../components/deviceEntries/DeviceEntry'
import {SeparatedItemList} from '../components/SeparatedItemList'

import {DataUtil, enoughCrownstonesInLocationsForIndoorLocalization} from "../../util/DataUtil";
import {background, colors, screenHeight, screenWidth, styles} from "../styles";
import {DfuStateHandler} from '../../native/firmware/DfuStateHandler';
import {DfuDeviceEntry} from '../components/deviceEntries/DfuDeviceEntry';
import {RoomExplanation} from '../components/RoomExplanation';
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {SphereDeleted} from "../static/SphereDeleted";
import {RoomDeleted} from "../static/RoomDeleted";
import {LiveComponent} from "../LiveComponent";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import {TopBarUtil} from "../../util/TopBarUtil";
import {xUtil} from "../../util/StandAloneUtil";
import {Icon} from "../components/Icon";
import {Background} from "../components/Background";
import {SetupStateHandler} from "../../native/setup/SetupStateHandler";
import {SetupDeviceEntry} from "../components/deviceEntries/SetupDeviceEntry";
import {SlideFadeInView} from "../components/animated/SlideFadeInView";
import {STONE_TYPES} from "../../Enums";
import {HubEntry} from "../components/deviceEntries/HubEntry";
import { Component, JSXElementConstructor } from "react";
import { Navigation } from "react-native-navigation";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}

export class RoomOverview extends LiveComponent<any, { switchView: boolean, scrollEnabled: boolean }> {
  static options(props) {
    getTopBarProps(core.store.getState(), props, true);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;
  viewingRemotely : boolean;
  viewingRemotelyInitial : boolean;
  justFinishedSetup : any;
  pictureTaken : any = null;
  nearestStoneIdInSphere : any;
  nearestStoneIdInRoom : any;
  amountOfDimmableCrownstonesInLocation: number;
  amountOfActiveCrownstonesInLocation: number;

  constructor(props) {
    super(props);

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

    this.state = {
      switchView: false,
      scrollEnabled: true
    };

    this.viewingRemotelyInitial = this.viewingRemotely;
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'edit')  { NavigationUtil.launchModal( "RoomEdit",{ sphereId: this.props.sphereId, locationId: this.props.locationId }); }
    if (buttonId === 'train') {
      if (core.store.getState().app.indoorLocalizationEnabled === false) {
        Alert.alert(
lang("_Indoor_localization_is_c_header"),
lang("_Indoor_localization_is_c_body"),
[{text: lang("_Indoor_localization_is_c_left") }]);
        return
      }

      if (this.viewingRemotely === true) {
        Alert.alert(
          lang("_Youre_not_in_the_Sphere__header"),
          lang("_Youre_not_in_the_Sphere__body"),
          [{ text: lang("_Youre_not_in_the_Sphere__left") }])
        return
      }

      const store = core.store;
      const state = store.getState();
      const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];
      if (room && room.config.fingerprintRaw) {
        Alert.alert(
          lang("_Retrain_Room__Only_do_th_header"),
          lang("_Retrain_Room__Only_do_th_body"),
          [{text: lang("_Retrain_Room__Only_do_th_left"), style: 'cancel'},
            {
              text: lang("_Retrain_Room__Only_do_th_right"), onPress: () => { NavigationUtil.launchModal( "RoomTraining_roomSize",{sphereId: this.props.sphereId, locationId: this.props.locationId}); }}
          ])
      }
    }
  }


  componentDidMount() {
    this.unsubscribeSetupEvents.push(core.eventBus.on("dfuStoneChange",   (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupStoneChange", (handle) => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(core.eventBus.on("setupComplete",    (handle) => {
      this.forceUpdate();
    }));

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeLocation && change.removeLocation.locationIds[this.props.locationId] ||
          change.removeSphere   && change.removeSphere.sphereIds[this.props.sphereId]) {
          return this.forceUpdate()
      }
      if (
        (change.updateStoneConfig)      ||
        (change.updateActiveSphere)     ||
        (change.changeFingerprint)      ||
        (change.userPositionUpdate      && change.userPositionUpdate.locationIds[this.props.locationId])   ||
        (change.updateLocationConfig    && change.updateLocationConfig.locationIds[this.props.locationId]) ||
        (change.changeSphereUsers       && change.changeSphereUsers.sphereIds[this.props.sphereId])        ||
        (change.changeStoneAvailability && change.changeStoneAvailability.sphereIds[this.props.sphereId])  ||
        (change.changeStoneRSSI         && change.changeStoneRSSI.sphereIds[this.props.sphereId])          ||
        (change.stoneUsageUpdated       && change.stoneUsageUpdated.sphereIds[this.props.sphereId])        ||
        (change.changeSphereState       && change.changeSphereState.sphereIds[this.props.sphereId])        ||
        (change.stoneLocationUpdated    && change.stoneLocationUpdated.sphereIds[this.props.sphereId])     ||
        (change.changeHubs)      ||
        (change.changeStones)
      ) {
        this.forceUpdate();
        this._updateNavBar();
        return;
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();

    // we keep open a connection for a few seconds to await a second command
    NAVBAR_PARAMS_CACHE = null;
  }

  _renderer(item, index, id) {
    if (item.type === 'dfuStone') {
      return (
        <View key={id + '_dfu_entry'}>
        <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <DfuDeviceEntry
            key={id + '_dfu_element'}
            sphereId={this.props.sphereId}
            handle={item.advertisement && item.advertisement.handle}
            name={item.data && item.data.name}
            stoneId={item.data && item.data.id}
          />
        </View>
      </View>
      )
    }
    else if (item.type === 'setupStone') {
      return (
        <View key={id + '_setup_entry'}>
          <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
            <SetupDeviceEntry
              key={id + '_setup_element'}
              sphereId={this.props.sphereId}
              handle={item.handle}
              item={item}
              restore={true}
              callback={() => {
                if (item.deviceType === STONE_TYPES.hub) {
                  NavigationUtil.launchModal(
                    "SetupHub",
                    {
                      sphereId: this.props.sphereId,
                      setupItem: item,
                      restoration: true
                    });
                }
                else {
                  NavigationUtil.launchModal(
                    "SetupCrownstone",
                    {
                      sphereId: this.props.sphereId,
                      setupItem: item,
                      restoration: true
                  });
                }
              }}
            />
          </View>
        </View>
      )
    }
    else if (item.type === 'stone' && item.data.config.type === STONE_TYPES.hub) {
      return (
        <View key={id + '_entry'}>
          <HubEntry
            sphereId={this.props.sphereId}
            stoneId={id}
            viewingRemotely={this.viewingRemotely}
            setSwitchView={(value) => { this.setState({switchView: value })}}
            switchView={this.state.switchView}
            nearestInSphere={id === this.nearestStoneIdInSphere}
            nearestInRoom={id === this.nearestStoneIdInRoom}
            toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
            amountOfDimmableCrownstonesInLocation={this.amountOfDimmableCrownstonesInLocation}
          />
        </View>
      );
    }
    else if (item.type === 'stone') {
      return (
        <View key={id + '_entry'}>
          <DeviceEntry
            sphereId={this.props.sphereId}
            stoneId={id}
            viewingRemotely={this.viewingRemotely}
            setSwitchView={(value) => { this.setState({switchView: value })}}
            switchView={this.state.switchView}
            nearestInSphere={id === this.nearestStoneIdInSphere}
            nearestInRoom={id === this.nearestStoneIdInRoom}
            toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
            amountOfDimmableCrownstonesInLocation={this.amountOfDimmableCrownstonesInLocation}
          />
        </View>
      );
    }
    else if (item.type === 'hub') {
      return (
        <View key={id + '_entry'}>
          <HubEntry
            sphereId={this.props.sphereId}
            hubId={id}
            viewingRemotely={this.viewingRemotely}
            setSwitchView={(value) => { this.setState({switchView: value })}}
            switchView={this.state.switchView}
            toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
            amountOfDimmableCrownstonesInLocation={this.amountOfDimmableCrownstonesInLocation}
          />
        </View>
      );
    }
  }

  _getItemList(stones, hubs) {
    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};
    let tempStoneDataArray = [];

    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();

      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        if (dfuStones[dfuId].data && dfuStones[dfuId].data.locationId === this.props.locationId) {
          shownHandles[dfuStones[dfuId].advertisement.handle] = true;
          ids.push(dfuId);
          dfuStones[dfuId].type = 'dfuStone';
          stoneArray.push(dfuStones[dfuId]);
        }
      });
    }
    else if (SetupStateHandler.areSetupStonesAvailable() && Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);
      // check if there are any setup stones that match the stones already in the database.
      stoneIds.forEach((stoneId) => {
        let stoneObj = stones[stoneId];
        let handle = stoneObj.config.handle;
        // only try showing the setup stone if it is not already a DFU stone
        if (shownHandles[handle] === undefined) {
          setupIds.forEach((setupId) => {
            if (setupStones[setupId].handle === handle) {
              shownHandles[handle] = true;
              ids.push(stoneId);
              // we do not want to overwrite the type, but the type we're using in this view is also required. We rename the incoming type to deviceType.
              let setupData = {...setupStones[setupId]};
              setupData.deviceType = setupData.type;
              stoneArray.push({
                ...setupData,
                type:'setupStone',
                name: stoneObj.config.name,
                icon: stoneObj.config.icon
              });
            }
          });
        }
      })
    }
    let shownStones = {};
    for (let [stoneId, stone] of Object.entries<StoneData>(stones)) {
      // do not show the same device twice
      let handle = stone.config.handle;
      if (shownHandles[handle] === undefined) {
        if (stone.abilities.dimming.enabledTarget) {
          this.amountOfDimmableCrownstonesInLocation += 1;
        }
        if (StoneAvailabilityTracker.isDisabled(stoneId) === false) {
          this.amountOfActiveCrownstonesInLocation += 1;
        }

        shownStones[stoneId] = true;
        tempStoneDataArray.push({type:'stone', data: stone, id: stoneId});
      }
      else {
        shownStones[stoneId] = true;
      }
    }

    // sort the order of things by crownstone Id
    tempStoneDataArray.sort((a,b) => { return a.data.config.uid - b.data.config.uid });


    for (let [hubId, hub] of Object.entries<HubData>(hubs)) {
      if (shownStones[hub.config.linkedStoneId] === undefined) {
        // do not show the same device twice
        tempStoneDataArray.push({ type: 'hub', data: hub, id: hubId });
      }
    }

    tempStoneDataArray.forEach((tmpStoneData) => {
      ids.push(tmpStoneData.id);
      stoneArray.push(tmpStoneData);
    });


    return { itemArray: stoneArray, ids };
  }


  _updateNavBar() {
    getTopBarProps(core.store.getState(), this.props, this.viewingRemotely);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
  }


  render() {
    const store = core.store;
    const state = store.getState();
    console.log(this.props)
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted/> }
    let location = sphere.locations[this.props.locationId];
    if (!location) {
      return <RoomDeleted/>
    }

    this.amountOfDimmableCrownstonesInLocation = 0;
    this.amountOfActiveCrownstonesInLocation = 0;
    let stones = DataUtil.getStonesInLocation(state, this.props.sphereId, this.props.locationId);
    let hubs   = DataUtil.getHubsInLocation(  state, this.props.sphereId, this.props.locationId);
    let backgroundImage = null;

    if (location.config.picture) {
      backgroundImage = { uri: xUtil.preparePictureURI(location.config.picture) };
    }

    let {itemArray, ids} = this._getItemList(stones, hubs);
    this._setNearestStoneInRoom(ids);
    this._setNearestStoneInSphere(sphere.stones);

    let explanation = this.amountOfDimmableCrownstonesInLocation > 0 ?  lang("Tap_Crownstone_icon_to_go") : lang("No_dimmable_Crownstones_i");
    if ( this.amountOfActiveCrownstonesInLocation === 0 ) {
      explanation = lang("No_Crownstones_in_reach__")
    }
    return (
      <Background image={background.main} testID={"RoomOverview"}>
        <View>
          { backgroundImage ? <Image source={backgroundImage} style={{width: screenWidth, height: screenHeight, position:'absolute', top:0, left:0, opacity:0.1}} resizeMode={"cover"} /> : undefined }
          <LocationFlavourImage location={location} />
        </View>
        <View style={{height:2, width:screenWidth, backgroundColor: colors.blue.hex}} />
        <ScrollView scrollEnabled={this.state.scrollEnabled}>
          <View style={{width:screenWidth}}>
            <RoomExplanation
              state={state}
              explanation={ this.props.explanation }
              sphereId={    this.props.sphereId }
              locationId={  this.props.locationId }
            />
            <SeparatedItemList
              items={itemArray}
              ids={ids}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
            <View style={{height:80}} />
          </View>
        </ScrollView>
        <SlideFadeInView
          visible={this.state.switchView}
          style={{position:'absolute', bottom:0, width:screenWidth, height:60, alignItems:'center', justifyContent:'center'}}
          height={80}
          pointerEvents={'none'}
        >
          <View style={{
            backgroundColor:colors.black.rgba(0.25),
            borderRadius:30,
            padding:10,
            alignItems:'center', justifyContent:'center'}}>
            <Text style={{ color: colors.white.hex, fontSize: 13, fontWeight:'bold'}}>{ explanation }</Text>
          </View>
        </SlideFadeInView>
      </Background>
    );
  }

  _setNearestStoneInRoom(ids) {
    let rssi = -1000;
    for (let i = 0; i < ids.length; i++) {
      let stoneRssi = StoneAvailabilityTracker.getAvgRssi(ids[i]);
      if (stoneRssi > rssi) {
        rssi = stoneRssi;
        this.nearestStoneIdInRoom = ids[i];
      }
    }
  }

  _setNearestStoneInSphere(allStones) {
    let rssi = -1000;
    let stoneIds = Object.keys(allStones);
    for (let i = 0; i < stoneIds.length; i++) {
      let stoneRssi = StoneAvailabilityTracker.getAvgRssi(stoneIds[i]);
      if (stoneRssi > rssi) {
        rssi = stoneRssi;
        this.nearestStoneIdInSphere = stoneIds[i];
      }
    }
  }
}

export function LocationFlavourImage(props : {location: any, height?: number}) {
  let location = props.location;
  let usedHeight = props.height || 120;
  if (location.config.picture) {
    return <Image source={{ uri: xUtil.preparePictureURI(location.config.picture) }} style={{width: screenWidth, height: usedHeight}} resizeMode={"cover"} />
  }
  else {
    return (
      <View style={{width:screenWidth, height: usedHeight, overflow:'hidden', alignItems:'flex-end', justifyContent:'center', paddingRight:15}}>
        <Image source={require("../../../assets/images/backgrounds/RoomBannerBackground.jpg")} style={{width: screenWidth, height: usedHeight, position:"absolute", top:0, left:0, opacity:0.75}} resizeMode={"cover"} />
        <Icon size={0.5*screenWidth} color={colors.white.rgba(0.3)} name={location.config.icon} style={{position:"absolute", top:-0.1*screenWidth, left:0.05*screenWidth}} />
        <Icon size={usedHeight*0.75} color={colors.white.rgba(0.75)} name={location.config.icon} />
      </View>
    )
  }
}


function getTopBarProps(state, props, viewingRemotely) {
  let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(props.sphereId);
  let sphere = state.spheres[props.sphereId];
  if (!sphere) { return }
  let location = sphere.locations[props.locationId];
  if (!location) { return }

  let title = location.config.name;

  NAVBAR_PARAMS_CACHE = { title }

  let spherePermissions = Permissions.inSphere(props.sphereId);

  if (spherePermissions.editRoom === true) {
    NAVBAR_PARAMS_CACHE["edit"] = true;
  }
  else if (spherePermissions.editRoom === false && enoughCrownstonesInLocations === true) {
    NAVBAR_PARAMS_CACHE["nav"] = {id:'train',text:'Train'};
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;



