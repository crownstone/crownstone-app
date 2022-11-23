import {Languages} from "../../Languages"
import * as React from 'react';
import {Platform, ScrollView, Text, TouchableOpacity, View} from "react-native";

import {DeviceEntry} from '../components/deviceEntries/DeviceEntry'

import {DataUtil} from "../../util/DataUtil";
import {
  availableScreenHeight,
  colors, getRoomStockImage,
  screenWidth,
  statusBarHeight,
  styles,
  tabBarHeight,
  topBarHeight, viewPaddingTop
} from "../styles";
import { DfuStateHandler }             from '../../native/firmware/DfuStateHandler';
import { DfuDeviceEntry_RoomOverview } from "../components/deviceEntries/DfuDeviceEntry";
import { RoomExplanation }             from '../components/RoomExplanation';
import { Permissions }                 from "../../backgroundProcesses/PermissionManager";
import { SphereDeleted }               from "../static/SphereDeleted";
import { RoomDeleted }                 from "../static/RoomDeleted";
import { LiveComponent }               from "../LiveComponent";
import { core }                        from "../../Core";
import { NavigationUtil }              from "../../util/navigation/NavigationUtil";
import { xUtil }                       from "../../util/StandAloneUtil";
import { BackgroundCustomTopBar }      from "../components/Background";
import { SetupStateHandler }           from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry_RoomOverview }        from "../components/deviceEntries/SetupDeviceEntry";
import { SlideFadeInView, SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import { STONE_TYPES }                 from "../../Enums";
import { HubEntry }                    from "../components/deviceEntries/HubEntry";
import { Blinker, NavBarBlur, TopBarBlur } from "../components/NavBarBlur";
import { BackIcon, EditDone, EditIcon, SettingsIconLeft } from "../components/EditIcon";
import { Icon }                        from "../components/Icon";
import { NotificationFiller }          from "../components/NotificationLine";
import { SortedList, SortingManager }  from "../../logic/SortingManager";
import { NestableDraggableFlatList, NestableScrollContainer } from "react-native-draggable-flatlist";
import { EventBusClass }               from "../../util/EventBus";
import { HeaderTitle }                 from "../components/HeaderTitle";
import { Get }                         from "../../util/GetUtil";
import { MapProvider }                 from "../../backgroundProcesses/MapProvider";
import { Blur } from "../components/Blur";
import { HighlightableIcon } from "../components/animated/HighlightableIcon";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}

const className = "RoomOverview";

interface RoomItem_stone {
  type:         'stone'
  id:            string,
  data:          StoneData,
}
interface RoomItem_hub {
  type:         'hub',
  id:            string,
  data:          HubData,
}
interface RoomItem_dfu {
  type:          'dfuStone'
  data:           any,
  advertisement?: any,
  deviceType?:    string,
}
interface RoomItem_setup {
  type:          'setupStone',
  id:             string,
  handle:         string,
  name:           string,
  icon:           string,
  advertisement?: any,
  deviceType?:    string,
}
type RoomItem = RoomItem_stone | RoomItem_hub | RoomItem_dfu | RoomItem_setup;

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
    for (let id in stones) { ids.push(stones[id].config.cloudId || id); }
    for (let id in hubs)   {
      if (!stones[hubs[id].config.linkedStoneId]) {
        hubs[id].config.cloudId || id;
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
        (change.updateActiveSphere)     ||
        (change.changeFingerprint)      ||
        (change.changeStoneAvailability && change.changeStoneAvailability.sphereIds[this.props.sphereId])  ||
        (change.changeStoneRSSI         && change.changeStoneRSSI.sphereIds[this.props.sphereId])          ||
        (change.stoneUsageUpdated       && change.stoneUsageUpdated.sphereIds[this.props.sphereId])        ||
        (change.changeSphereState       && change.changeSphereState.sphereIds[this.props.sphereId])        ||
        (change.stoneLocationUpdated    && change.stoneLocationUpdated.sphereIds[this.props.sphereId])
      ) {
        this.forceUpdate();
        return;
      }
      if (
        (change.updateStoneConfig) ||
        (change.stoneLocationUpdated && change.stoneLocationUpdated.sphereIds[this.props.sphereId]) ||
        (change.changeHubs)        ||
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

  renderDraggableItem = (item: RoomItem, index: number, drag: () => void, isActive: boolean) => {
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
          key={item.id + '_item'}
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
          stoneId={item.id}
          key={item.id + '_item'}
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
          key={item.id + '_item'}
          sphereId={this.props.sphereId}
          stoneId={item.id}
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
          key={item.id + '_item'}
          hubId={item.id}
          editMode={this.state.editMode}

          isBeingDragged={isActive}
          eventBus={this.localEventBus}
          dragAction={drag}
        />
      );
    }
  }

  _getItemList(stones : Record<stoneId, StoneData>, hubs: Record<hubId, HubData>) : RoomItem[] {
    let stoneArray : RoomItem[] = [];
    let stoneIds = Object.keys(stones);
    let shownHandles = {};

    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();

      for (let dfuId in dfuStones) {
        if (dfuStones[dfuId].data && dfuStones[dfuId].data.locationId === this.props.locationId) {
          shownHandles[dfuStones[dfuId].advertisement.handle] = true;
          stoneArray.push({...dfuStones[dfuId], type: 'dfuStone'});
        }
      };

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
    for (let cloudId of idList) {
      let localId = MapProvider.cloud2localMap.stones[cloudId] ?? MapProvider.cloud2localMap.hubs[cloudId] ?? cloudId;
      let item = stones[localId] ?? hubs[localId];

      // stone
      if ('handle' in item.config && shownHandles[item.config.handle] === undefined) {
        shownStones[localId] = true;
        stoneArray.push({ type: 'stone', data: item as StoneData, id: localId });
      }
      else if ('linkedStoneId' in item.config && !shownStones[item.config.linkedStoneId]) {
        // do not show the same device twice
        stoneArray.push({ type: 'hub', data: item as HubData, id: localId });
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
          testID={'RoomOverview_NestableScrollContainer'}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior={'never'}
          contentContainerStyle={{paddingTop: viewPaddingTop, paddingBottom: 2*tabBarHeight}}
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
            onDragEnd={({ data } : { data: RoomItem[] }) => {
              if (!this.state.dragging) { return; }

              let dataToUse = [];

              let ids = this.getIdsInRoom();
              let idMap = {};
              for (let id of ids) { idMap[id] = true; }

              for (let i = 0; i < data.length; i++) {
                if (data[i].type !== 'stone' && data[i].type !== 'hub') { continue; }

                let castData : (RoomItem_stone | RoomItem_hub) = data[i] as (RoomItem_stone | RoomItem_hub);
                let cloudId = castData.data?.config.cloudId || castData.id;
                if (idMap[cloudId] !== undefined) {
                  dataToUse.push(cloudId);
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
            setEditMode={() => { this.setState({editMode: true})  }}
            endEditMode={() => { this.setState({editMode: false}) }}
          />
        </TopBarBlur>
        <NavBarBlur xxlight line/>
        { !this.state.editMode && this.amountOfDimmableCrownstonesInLocation > 0 && sphere.state.reachable &&
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

  let state = core.store.getState();
  let shouldHighlight = state.app.hasSeenDimmingButton === false;

  return (
    <TouchableOpacity style={{
      position:'absolute',
      bottom: tabBarHeight + 5, right: 5
    }} onPress={() => {
      let state = core.store.getState();
      if (state.app.hasSeenDimmingButton === false) {
        core.store.dispatch({type:"UPDATE_APP_SETTINGS", data: {hasSeenDimmingButton: true}});
      }
      setDimMode(!dimMode);
    }}>
      <Blur
        blurType={'light'}
        blurAmount={4}
        style={{...styles.centered, width: size, height: size, borderRadius: 15, backgroundColor: dimMode ?
            colors.green.rgba(Platform.OS === 'android' ? 0.8 : 0.5) :
            colors.blue.rgba( Platform.OS === 'android' ? 0.6 : 0.3)}}
      >
        <SlideFadeInView style={styles.centered} visible={dimMode} height={size}>
          <Icon name={'md-switch'} size={50} color={colors.white.hex} />
        </SlideFadeInView>
        <SlideFadeInView style={styles.centered} visible={!dimMode} height={size}>
          <HighlightableIcon name={'ion5-ios-bulb-outline'} size={42} color={colors.white.hex} enabled={shouldHighlight} />
        </SlideFadeInView>
        { shouldHighlight && <Blinker style={{top:0.5*size, left:0.5*size}}  /> }
      </Blur>
    </TouchableOpacity>
  );
}


function RoomHeader({editMode, setEditMode, endEditMode, location, sphereId}) {
  let launchEditModal = () => {
    let state = core.store.getState();
    if (state.app.hasSeenEditLocationIcon === false) {
      core.store.dispatch({type:"UPDATE_APP_SETTINGS", data: {hasSeenEditLocationIcon: true}});
    }
    NavigationUtil.launchModal("RoomEdit", {sphereId, locationId: location.id});
  };

  let amountOfCrownstonesInLocation = DataUtil.getAmountOfCrownstonesInLocation(sphereId, location.id);
  let state = core.store.getState();
  let shouldHighlight = state.app.hasSeenEditLocationIcon === false || amountOfCrownstonesInLocation === 0;


  return (
    <View style={{flexDirection:'row', alignItems:'center', width: screenWidth}}>
      <BackIcon />
      <TouchableOpacity
        activeOpacity={editMode ? 0.2 : 1.0}
        style={{alignItems:'center', justifyContent:'center'}}
        onPress={editMode ? launchEditModal : () => {}}
        testID={'editRoomLabel'}
      >
        <HeaderTitle title={location.config.name} maxWidth={screenWidth-70-50-50}/>
      </TouchableOpacity>
      <SlideSideFadeInView visible={editMode} width={50}>
        <SettingsIconLeft onPress={launchEditModal} highlight={shouldHighlight} testID={'editRoom'}/>
      </SlideSideFadeInView>
      <View style={{flex:1, height:30}} />
      <SlideSideFadeInView visible={editMode} width={70}><EditDone onPress={endEditMode} /></SlideSideFadeInView>
      <SlideSideFadeInView visible={!editMode} width={50}><EditIcon onPress={setEditMode} /></SlideSideFadeInView>
    </View>
  )
}
