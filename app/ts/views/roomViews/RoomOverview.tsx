import {Languages} from "../../Languages"
import * as React from 'react';
import { ScrollView, Text, TouchableOpacity, View} from "react-native";

import {DeviceEntry} from '../components/deviceEntries/DeviceEntry'

import {DataUtil, enoughCrownstonesInLocationsForIndoorLocalization} from "../../util/DataUtil";
import {
  availableScreenHeight,
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
import { DfuDeviceEntry, DfuDeviceEntry_RoomOverview } from "../components/deviceEntries/DfuDeviceEntry";
import {RoomExplanation} from '../components/RoomExplanation';
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {SphereDeleted} from "../static/SphereDeleted";
import {RoomDeleted} from "../static/RoomDeleted";
import {LiveComponent} from "../LiveComponent";
import {core} from "../../Core";
import {NavigationUtil} from "../../util/navigation/NavigationUtil";
import {StoneAvailabilityTracker} from "../../native/advertisements/StoneAvailabilityTracker";
import {xUtil} from "../../util/StandAloneUtil";
import {Background, BackgroundCustomTopBar} from "../components/Background";
import {SetupStateHandler} from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry_RoomOverview } from "../components/deviceEntries/SetupDeviceEntry";
import { SlideFadeInView, SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import {STONE_TYPES} from "../../Enums";
import {HubEntry} from "../components/deviceEntries/HubEntry";
import { BackIcon, EditDone, EditIcon, SettingsIconLeft } from "../components/EditIcon";
import { NavBarBlur, TopBarBlur } from "../components/NavBarBlur";
import {Icon} from "../components/Icon";
import {BlurView} from "@react-native-community/blur";
import { NotificationFiller } from "../components/NotificationLine";
import { SortedList, SortingManager } from "../../logic/SortingManager";
import { SceneCreateNewItem } from "../scenesViews/supportComponents/SceneCreateNewItem";
import { NestableDraggableFlatList, NestableScrollContainer } from "react-native-draggable-flatlist";
import { EventBusClass } from "../../util/EventBus";
import { HeaderTitle } from "../components/HeaderTitle";
import { Get } from "../../util/GetUtil";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}

const className = "RoomOverview";

interface RoomItemList {
  id:             string,
  handle?:        string,
  name?:          string,
  icon?:          string,
  type:           'stone' | 'hub' | 'dfuStone' | 'setupStone',
  data?:          any,
  advertisement?: any,
  deviceType?:    string,
}

export const PERSISTED_DIMMING_OVERLAY_STATE = {
  value: false
}

export class RoomOverview extends LiveComponent<any, { editMode: boolean, dimMode: boolean, data: string[], dragging: boolean }> {
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

  localEventBus: EventBusClass;
  sortedList : SortedList;

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

    let location = Get.location(this.props.sphereId, this.props.locationId);

    this.sortedList = SortingManager.getList(
      this.props.sphereId,
      className,location?.config?.cloudId || this.props.locationId,
      this.getIdsInRoom()
    );
    this.state = {
      editMode: false,
      dimMode: PERSISTED_DIMMING_OVERLAY_STATE.value,

      dragging: false,
      data: this.sortedList.getDraggableList(),
    };


    this.localEventBus = new EventBusClass("RoomOverview"+this.props.locationId);
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

        this.sortedList.mustContain(this.getIdsInRoom());
        this.forceUpdate();
        return;
      }
    });
  }

  componentWillUnmount() {
    this.localEventBus.clearAllEvents();
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }

  renderDraggableItem = (item: RoomItemList, index: number, drag: () => void, isActive: boolean) => {
    let id = item.id;
    if (item.type === 'dfuStone') {
      return (
        <DfuDeviceEntry_RoomOverview
          sphereId={this.props.sphereId}
          handle={item.advertisement && item.advertisement.handle}
          name={item.data && item.data.name}
          stoneId={item.data && item.data.id}
        />
      );
    }
    else if (item.type === 'setupStone') {
      return (
        <SetupDeviceEntry_RoomOverview
          key={id + '_item'}
          sphereId={this.props.sphereId}
          handle={item.handle}
          item={item as {name: string, icon: string}}
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
      );
    }
    else if (item.type === 'stone' && item.data.config.type === STONE_TYPES.hub) {
      return (
        <HubEntry
          sphereId={this.props.sphereId}
          stoneId={id}
          key={id + '_item'}
          editMode={this.state.editMode}

          isBeingDragged={isActive}
          eventBus={this.localEventBus}
          dragAction={drag}
        />
      );
    }
    else if (item.type === 'stone') {
      return (
        <DeviceEntry
          key={id + '_item'}
          sphereId={this.props.sphereId}
          stoneId={id}
          dimMode={this.state.dimMode && !this.state.editMode}
          editMode={this.state.editMode}

          isBeingDragged={isActive}
          eventBus={this.localEventBus}
          dragAction={drag}
        />
      );
    }
    else if (item.type === 'hub') {
      return (
        <HubEntry
          sphereId={this.props.sphereId}
          key={id + '_item'}
          hubId={id}
          editMode={this.state.editMode}

          isBeingDragged={isActive}
          eventBus={this.localEventBus}
          dragAction={drag}
        />
      );
    }
  }

  _getItemList(stones : Record<stoneId, StoneData>, hubs: Record<hubId, HubData>) : RoomItemList[] {
    let stoneArray : RoomItemList[] = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};

    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();

      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        if (dfuStones[dfuId].data && dfuStones[dfuId].data.locationId === this.props.locationId) {
          shownHandles[dfuStones[dfuId].advertisement.handle] = true;
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
              // we do not want to overwrite the type, but the type we're using in this view is also required. We rename the incoming type to deviceType.
              let setupData = {...setupStones[setupId], deviceType: setupStones[setupId].type};
              stoneArray.push({
                ...setupData,
                type:'setupStone',
                id: setupData.handle,
                name: stoneObj.config.name,
                icon: stoneObj.config.icon
              });
            }
          });
        }
      })
    }

    let idList = this.sortedList.getDraggableList();
    let shownStones = {};
    for (let id of idList) {
      let item = stones[id] ?? hubs[id];

      // stone
      if ('handle' in item.config && shownHandles[item.config.handle] === undefined) {
        shownStones[id] = true;
        stoneArray.push({ type: 'stone', data: item, id: id });
      }
      else if ('linkedStoneId' in item.config && !shownStones[item.config.linkedStoneId]) {
        // do not show the same device twice
        stoneArray.push({ type: 'hub', data: item, id: id });
      }
    }

    return stoneArray;
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

    let itemArray = this._getItemList(stones, hubs);

    return (
      <BackgroundCustomTopBar image={backgroundImage} fullScreen={true} testID={"RoomOverview"}>
        <NestableScrollContainer
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingTop: topBarHeight - statusBarHeight, paddingBottom: 2*tabBarHeight}}
        >
          <NotificationFiller visible={this.state.editMode ? false : undefined} />
          <RoomExplanation
            explanation={ this.props.explanation }
            sphereId={    this.props.sphereId }
            locationId={  this.props.locationId }
          />
          <NestableDraggableFlatList
            containerStyle={{minHeight: availableScreenHeight, paddingTop: 10}}
            activationDistance={this.state.dragging ? 5 : 120}
            data={itemArray}
            onDragBegin={() => { this.setState({dragging: true}); }}
            onRelease={() => {
              this.localEventBus.emit("END_DRAG" );
            }}
            renderItem={({ item, index, drag, isActive }) => { return this.renderDraggableItem( item, index, drag, isActive ); }}
            keyExtractor={(item : any, index) => `${item.id}_item`}
            onDragEnd={({ data }) => {
              let dataToUse = [];

              let ids = this.getIdsInRoom();
              let idMap = {};
              for (let id of ids) { idMap[id] = true; }

              for (let i = 0; i < data.length; i++) {
                if (idMap[data[i].id] !== undefined) {
                  dataToUse.push(data[i].id);
                }
              }
              this.sortedList.update(dataToUse as string[]);
              this.setState({ dragging:false });
            }}
          />
        </NestableScrollContainer>

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
        { this.amountOfDimmableCrownstonesInLocation > 0 && sphere.state.reachable &&
          <DimmerSwitch dimMode={this.state.dimMode} setDimMode={(state) => {
            this.setState({dimMode:state});
            PERSISTED_DIMMING_OVERLAY_STATE.value = state;
          }} /> }
      </BackgroundCustomTopBar>
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

  let amountOfCrownstonesInLocation = DataUtil.getAmountOfCrownstonesInLocation(sphereId, location.id);

  return (
    <View style={{flexDirection:'row', alignItems:'center', width: screenWidth}}>
      <BackIcon />
      <TouchableOpacity
        activeOpacity={editMode ? 0.2 : 1.0}
        style={{alignItems:'center', justifyContent:'center'}}
        onPress={editMode ? launchEditModal : () => {}}
      >
        <HeaderTitle title={location.config.name} maxWidth={screenWidth-70-50-50}/>
      </TouchableOpacity>
      <SlideSideFadeInView visible={editMode} width={50}><SettingsIconLeft onPress={launchEditModal} highlight={amountOfCrownstonesInLocation === 0}/></SlideSideFadeInView>
      <View style={{flex:1, height:30}} />
      <SlideSideFadeInView visible={editMode} width={70}><EditDone onPress={endEditMode} /></SlideSideFadeInView>
      <SlideSideFadeInView visible={!editMode} width={50}><EditIcon onPress={setEditMode} /></SlideSideFadeInView>
    </View>
  )
}
