
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {  Alert, Image, ScrollView, View } from "react-native";

import { DeviceEntry }          from '../components/deviceEntries/DeviceEntry'
import { BatchCommandHandler }  from '../../logic/BatchCommandHandler'
import { SeparatedItemList }    from '../components/SeparatedItemList'

import {
  enoughCrownstonesInLocationsForIndoorLocalization, DataUtil
} from "../../util/DataUtil";
import {
  styles,
  colors,
  screenHeight,
  screenWidth,
} from "../styles";
import { DfuStateHandler }        from '../../native/firmware/DfuStateHandler';
import { DfuDeviceEntry }         from '../components/deviceEntries/DfuDeviceEntry';
import { RoomExplanation }        from '../components/RoomExplanation';
import { Permissions }            from "../../backgroundProcesses/PermissionManager";
import { SphereDeleted }          from "../static/SphereDeleted";
import { RoomDeleted }            from "../static/RoomDeleted";
import { LiveComponent }          from "../LiveComponent";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Navigation } from "react-native-navigation";
import { TopBarUtil } from "../../util/TopBarUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { Icon } from "../components/Icon";
import { Background } from "../components/Background";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { SetupDeviceEntry } from "../components/deviceEntries/SetupDeviceEntry";



export class RoomOverview extends LiveComponent<any, any> {
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

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'edit')  { NavigationUtil.launchModal( "RoomEdit",{ sphereId: this.props.sphereId, locationId: this.props.locationId }); }
    if (buttonId === 'train') {
      if (core.store.getState().app.indoorLocalizationEnabled === false) {
        Alert.alert(
          "Indoor localization is currently disabeld",
          "Take a look at the app settings if you'd like to change this.",
          [{ text: "OK" }]);
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
    else if (item.setupMode === true) {
      return (
        <View key={stoneId + '_setup_entry'}>
          <View style={[styles.listView, {backgroundColor: colors.white.rgba(0.8)}]}>
            <SetupDeviceEntry
              key={stoneId + '_setup_element'}
              sphereId={this.props.sphereId}
              handle={item.handle}
              item={item}
              restore={true}
              callback={() => {
                NavigationUtil.launchModal(
                  "SetupCrownstone",
                  {
                    sphereId: this.props.sphereId,
                    setupStone: item,
                    restoration: true
                });
              }}
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
            dfuMode={item.dfuMode === true}
          />
        </View>
      );
    }
  }

  _getStoneList(stoneData) {
    let stoneArray = [];
    let ids = [];
    let stoneIds = Object.keys(stoneData);
    let shownHandles = {};
    let tempStoneDataArray = [];

    if (DfuStateHandler.areDfuStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      let dfuStones = DfuStateHandler.getDfuStones();

      let dfuIds = Object.keys(dfuStones);
      dfuIds.forEach((dfuId) => {
        if (dfuStones[dfuId].data && dfuStones[dfuId].data.locationId === this.props.locationId) {
          shownHandles[dfuStones[dfuId].advertisement.handle] = true;
          ids.push(dfuId);
          dfuStones[dfuId].dfuMode = true;
          stoneArray.push(dfuStones[dfuId]);
        }
      });
    }
    else if (SetupStateHandler.areSetupStonesAvailable() && Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
      let setupStones = SetupStateHandler.getSetupStones();
      let setupIds = Object.keys(setupStones);
      // check if there are any setup stones that match the stones already in the database.
      stoneIds.forEach((stoneId) => {
        let stoneObj = stoneData[stoneId];
        let handle = stoneObj.config.handle;
        // only try showing the setup stone if it is not already a DFU stone
        if (shownHandles[handle] === undefined) {
          setupIds.forEach((setupId) => {
            if (setupStones[setupId].handle === handle) {
              shownHandles[handle] = true;
              ids.push(stoneId);
              stoneArray.push({
                setupMode: true,
                handle: handle,
                name: stoneObj.config.name,
                icon: stoneObj.config.icon
              });
            }
          });
        }
      })
    }

    stoneIds.forEach((stoneId) => {
      // do not show the same device twice
      let handle = stoneData[stoneId].config.handle;
      if (shownHandles[handle] === undefined) {
        tempStoneDataArray.push({stone: stoneData[stoneId], id: stoneId});
      }
    });

    // sort the order of things by crownstone Id
    tempStoneDataArray.sort((a,b) => { return a.stone.config.crownstoneId - b.stone.config.crownstoneId });

    tempStoneDataArray.forEach((tmpStoneData) => {
      ids.push(tmpStoneData.id);
      stoneArray.push(tmpStoneData);
    });

    return { stoneArray, ids };
  }


  _updateNavBar() {
    getTopBarProps(core.store.getState(), this.props, this.viewingRemotely);
    Navigation.mergeOptions(this.props.componentId, TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE))
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

    let stones = DataUtil.getStonesInLocation(state, this.props.sphereId, this.props.locationId);
    let backgroundImage = null;

    if (location.config.picture) {
      backgroundImage = { uri: xUtil.preparePictureURI(location.config.picture) };
    }

    let {stoneArray, ids} = this._getStoneList(stones);
    this._setNearestStoneInRoom(ids);
    this._setNearestStoneInSphere(state.spheres[this.props.sphereId].stones);

    return (
      <Background image={core.background.lightBlur}>
        { backgroundImage ? <Image source={backgroundImage} style={{width: screenWidth, height: screenHeight, position:'absolute', top:0, left:0, opacity:0.1}} resizeMode={"cover"} /> : undefined }
        <LocationFlavourImage location={location} />
        <View style={{height:2, width:screenWidth, backgroundColor: colors.blue.hex}} />
        <ScrollView>
          <View style={{width:screenWidth}}>
            <RoomExplanation
              state={state}
              explanation={ this.props.explanation }
              sphereId={    this.props.sphereId }
              locationId={  this.props.locationId }
            />
            <SeparatedItemList
              items={stoneArray}
              ids={ids}
              separatorIndent={false}
              renderer={this._renderer.bind(this)}
            />
            <View style={{height:60}} />
          </View>
        </ScrollView>
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
  let location = props.location
  let usedHeight = props.height || 120;
  if (location.config.picture) {
    return <Image source={{ uri: xUtil.preparePictureURI(location.config.picture) }} style={{width: screenWidth, height: usedHeight}} resizeMode={"cover"} />
  }
  else {
    return (
      <View style={{width:screenWidth, height: usedHeight, overflow:'hidden', alignItems:'flex-end', justifyContent:'center', paddingRight:15}}>
        <Image source={require("../../images/backgrounds/RoomBannerBackground.png")} style={{width: screenWidth, height: usedHeight, position:"absolute", top:0, left:0, opacity:0.75}} resizeMode={"cover"} />
        <Icon size={0.5*screenWidth} color={colors.white.rgba(0.3)} name={location.config.icon} style={{position:"absolute", top:-0.1*screenWidth, left:0.05*screenWidth}} />
        <Icon size={usedHeight*0.75} color={colors.white.rgba(0.75)} name={location.config.icon} />
      </View>
    )
  }
}


function getTopBarProps(state, props, viewingRemotely) {
  let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(state, props.sphereId);
  let sphere = state.spheres[props.sphereId];
  if (!sphere) { return }
  let location = sphere.locations[props.locationId];
  if (!location) { return }

  let title = location.config.name;

  NAVBAR_PARAMS_CACHE = { title: title }

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



