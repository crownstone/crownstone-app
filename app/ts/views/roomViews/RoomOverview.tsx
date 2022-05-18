import {Languages} from "../../Languages"
import * as React from 'react';
import { ScrollView, Text, TouchableOpacity, View} from "react-native";

import {DeviceEntry} from '../components/deviceEntries/DeviceEntry'

import {DataUtil, enoughCrownstonesInLocationsForIndoorLocalization} from "../../util/DataUtil";
import {
  background,
  colors, getRoomStockImage, RoomStockBackground,
  screenHeight,
  screenWidth,
  statusBarHeight,
  styles,
  tabBarHeight,
  topBarHeight
} from "../styles";
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
import {xUtil} from "../../util/StandAloneUtil";
import {Background} from "../components/Background";
import {SetupStateHandler} from "../../native/setup/SetupStateHandler";
import {SetupDeviceEntry} from "../components/deviceEntries/SetupDeviceEntry";
import { SlideFadeInView, SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import {STONE_TYPES} from "../../Enums";
import {HubEntry} from "../components/deviceEntries/HubEntry";
import { BackIcon, EditDone, EditIcon, SettingsIconLeft } from "../components/EditIcon";
import { NavBarBlur, TopBarBlur } from "../components/NavBarBlur";
import {Icon} from "../components/Icon";
import {BlurView} from "@react-native-community/blur";
import { NotificationFiller } from "../components/NotificationLine";
import {SortingManager} from "../../logic/SortingManager";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}

const className = "RoomOverview";

export class RoomOverview extends LiveComponent<any, { switchView: boolean, scrollEnabled: boolean, editMode: boolean, dimMode: boolean }> {
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

  sortedList
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
      scrollEnabled: true,
      editMode: false,
      dimMode: false,
    };

    this.sortedList = SortingManager.getList(this.props.sphereOverview, className, this.props.locationId, this.getIdsInRoom());

    this.viewingRemotelyInitial = this.viewingRemotely;
  }

  getIdsInRoom() {
    let stones = DataUtil.getStonesInLocation(this.props.sphereId, this.props.locationId);
    let hubs   = DataUtil.getHubsInLocation(  this.props.sphereId, this.props.locationId);
    let ids = [];
    for (let id in stones) { ids.push(id); }
    for (let id in hubs)   {
      if (!stones[hubs[id].config.linkedStoneId]) {
        ids.push(id);
      }
    }
    return ids;
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
        (change.updateLocationConfig    && change.updateLocationConfig.locationIds[this.props.locationId]) ||
        (change.changeStoneAvailability && change.changeStoneAvailability.sphereIds[this.props.sphereId])  ||
        (change.changeStoneRSSI         && change.changeStoneRSSI.sphereIds[this.props.sphereId])          ||
        (change.stoneUsageUpdated       && change.stoneUsageUpdated.sphereIds[this.props.sphereId])        ||
        (change.changeSphereState       && change.changeSphereState.sphereIds[this.props.sphereId])        ||
        (change.stoneLocationUpdated    && change.stoneLocationUpdated.sphereIds[this.props.sphereId])     ||
        (change.changeHubs)      ||
        (change.changeStones)
      ) {
        this.forceUpdate();
        return;
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }

  _renderer(item, index, id) {
    if (item.type === 'dfuStone') {
      return (
        <View key={id + '_dfu_entry'} style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
          <DfuDeviceEntry
            key={id + '_dfu_element'}
            sphereId={this.props.sphereId}
            handle={item.advertisement && item.advertisement.handle}
            name={item.data && item.data.name}
            stoneId={item.data && item.data.id}
          />
        </View>
      );
    }
    else if (item.type === 'setupStone') {
      return (
        <View key={id + '_setup_entry'} style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
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
      );
    }
    else if (item.type === 'stone' && item.data.config.type === STONE_TYPES.hub) {
      return (
        <HubEntry
          sphereId={this.props.sphereId}
          stoneId={id}
          key={id + '_entry'}
          viewingRemotely={this.viewingRemotely}
          setSwitchView={(value) => { this.setState({switchView: value })}}
          switchView={this.state.switchView}
          nearestInSphere={id === this.nearestStoneIdInSphere}
          nearestInRoom={id === this.nearestStoneIdInRoom}
          toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
          amountOfDimmableCrownstonesInLocation={this.amountOfDimmableCrownstonesInLocation}
        />
      );
    }
    else if (item.type === 'stone') {
      return (
        <DeviceEntry
          key={id + '_entry'}
          sphereId={this.props.sphereId}
          stoneId={id}
          viewingRemotely={this.viewingRemotely}
          dimMode={this.state.dimMode && !this.state.editMode}
          editMode={this.state.editMode}
        />
      );
    }
    else if (item.type === 'hub') {
      return (
        <HubEntry
          sphereId={this.props.sphereId}
          key={id + '_entry'}
          hubId={id}
          viewingRemotely={this.viewingRemotely}
          setSwitchView={(value) => { this.setState({switchView: value })}}
          switchView={this.state.switchView}
          toggleScrollView={(value) => { this.setState({scrollEnabled: value })}}
          amountOfDimmableCrownstonesInLocation={this.amountOfDimmableCrownstonesInLocation}
        />
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

    if (SetupStateHandler.areSetupStonesAvailable() && Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
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
      shownStones[stoneId] = true;

      if (shownHandles[handle] === undefined) {
        tempStoneDataArray.push({type:'stone', data: stone, id: stoneId});
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


  _getStones(itemArray : any[], ids) {
    return itemArray.map((item, index) => { return this._renderer(item, index, ids[index]); })
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return <SphereDeleted/> }
    let location = sphere.locations[this.props.locationId];
    if (!location) {
      return <RoomDeleted/>
    }

    this.amountOfDimmableCrownstonesInLocation = DataUtil.getAmountOfDimmableStonesInLocation(this.props.sphereId, this.props.locationId);
    this.amountOfActiveCrownstonesInLocation   = DataUtil.getAmountOfActiveStonesInLocation(this.props.sphereId, this.props.locationId);
    let stones = DataUtil.getStonesInLocation(this.props.sphereId, this.props.locationId);
    let hubs   = DataUtil.getHubsInLocation(  this.props.sphereId, this.props.locationId);
    let backgroundImage = null;

    if (location.config.picture && location.config.pictureSource === "CUSTOM") {
      backgroundImage = { uri: xUtil.preparePictureURI(location.config.picture) };
    }
    else if (location.config.pictureSource === "STOCK") {
      backgroundImage = getRoomStockImage(location.config.picture);
    }

    let {itemArray, ids} = this._getItemList(stones, hubs);
    let explanation = this.amountOfDimmableCrownstonesInLocation > 0 ?  lang("Tap_Crownstone_icon_to_go") : lang("No_dimmable_Crownstones_i");
    if ( this.amountOfActiveCrownstonesInLocation === 0 ) {
      explanation = lang("No_Crownstones_in_reach__");
    }

    return (
      <Background image={backgroundImage} fullScreen={true} testID={"RoomOverview"}>
        <ScrollView scrollEnabled={this.state.scrollEnabled} contentContainerStyle={{paddingTop: topBarHeight-statusBarHeight}}>
          <View style={{width:screenWidth}}>
            <RoomExplanation
              state={state}
              explanation={ this.props.explanation }
              sphereId={    this.props.sphereId }
              locationId={  this.props.locationId }
            />
            <NotificationFiller />
            <View style={{height:15}} />
            { this._getStones(itemArray, ids) }
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
        <TopBarBlur xxlight showNotifications={!this.state.editMode}>
          <RoomHeader
            sphereId={this.props.sphereId}
            location={location}
            editMode={this.state.editMode}
            setEditMode={() => { this.setState({editMode: true})}}
            endEditMode={() => {this.setState({editMode: false})}}
          />
        </TopBarBlur>
        <NavBarBlur xxlight line/>
        { this.amountOfDimmableCrownstonesInLocation > 0 &&
          <DimmerSwitch dimMode={this.state.dimMode} setDimMode={(state) => { this.setState({dimMode:state})}} /> }
      </Background>
    );
  }
}


function DimmerSwitch({dimMode, setDimMode}) {
  let size = 65;
  return (
    <TouchableOpacity style={{
      position:'absolute',
      bottom: tabBarHeight + 5, right: 5
    }} onPress={() => { setDimMode(!dimMode); }}>
      <BlurView
        blurType={'light'}
        blurAmount={4}
        style={{...styles.centered, width: size, height: size, borderRadius: 15, backgroundColor: dimMode ? colors.green.rgba(0.4) : colors.blue.rgba(0.2)}}
      >
        <SlideFadeInView style={styles.centered} visible={dimMode} height={size}>
          <Icon name={'md-switch'} size={50} color={colors.white.hex} />
        </SlideFadeInView>
        <SlideFadeInView style={styles.centered} visible={!dimMode} height={size}>
          <Icon name={'ion5-ios-bulb-outline'} size={42} color={colors.white.hex} />
        </SlideFadeInView>
      </BlurView>
    </TouchableOpacity>
  );
}


function RoomHeader({editMode, setEditMode, endEditMode, location, sphereId}) {
  let launchEditModal = () => { NavigationUtil.launchModal("RoomEdit", {sphereId, locationId: location.id})};
  return (
    <View style={{flexDirection:'row', alignItems:'center'}}>
      <SlideSideFadeInView visible={!editMode} width={53}><BackIcon /></SlideSideFadeInView>
      <SlideSideFadeInView visible={editMode} width={15} />
      <TouchableOpacity
        activeOpacity={editMode ? 0.2 : 1.0}
        style={{alignItems:'center', justifyContent:'center'}}
        onPress={editMode ? launchEditModal : () => {}}
      >
        <Text style={styles.viewHeader}>{location.config.name}</Text>
      </TouchableOpacity>
      <SlideSideFadeInView visible={editMode} width={60}><SettingsIconLeft onPress={launchEditModal}/></SlideSideFadeInView>
      <View style={{flex:1}} />
      <SlideSideFadeInView visible={editMode} width={80}><EditDone onPress={endEditMode} /></SlideSideFadeInView>
      <SlideSideFadeInView visible={!editMode} width={100}><EditIcon onPress={setEditMode} /></SlideSideFadeInView>
    </View>
  )
}


