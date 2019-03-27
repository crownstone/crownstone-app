
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomAdd", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ScrollView,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { IconCircle } from '../components/IconCircle'
import { ListEditableItems } from '../components/ListEditableItems'
import { getLocationNamesInSphere, getStonesAndAppliancesInLocation } from '../../util/DataUtil'
import {LOGe} from '../../logging/Log'

import {colors, OrangeLine} from '../styles'
import {processImage} from "../../util/Util";
import {transferLocations} from "../../cloud/transferData/transferLocations";
import {MapProvider} from "../../backgroundProcesses/MapProvider";

import {TopbarButton} from "../components/topbar/TopbarButton";
import {CancelButton} from "../components/topbar/CancelButton";
import {getRandomRoomIcon} from "./RoomIconSelection";
import { xUtil } from "../../util/StandAloneUtil";
import { FileUtil } from "../../util/FileUtil";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";



export class RoomAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Create_Room"),
      headerLeft: <CancelButton onPress={() => { params.leftAction ? params.leftAction() : navigation.goBack(); }}/>,
      headerRight: <TopbarButton
        text={ lang("Create")}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
    }
  };

  refName : string;
  removePictureQueue = [];

  constructor(props) {
    super(props);
    let initialState = {name:'', icon: getRandomRoomIcon(), selectedStones: {}, picture: null};
    this.refName = "listItems";

    if (props.movingCrownstone) {
      let selectedStones = {};
      selectedStones[props.movingCrownstone] = true;
      initialState.selectedStones = selectedStones;
    }

    this.state = initialState;

    this.props.navigation.setParams({leftAction: () => { this.cancelEdit(); }, rightAction: () => { this.createRoom(); }})
  }

  cancelEdit() {
    // clean up any pictures that were taken
    this._removeUnusedPictures();
    this._removePicture(this.state.picture);
    this.props.navigation.goBack(null);
  }

  _removeUnusedPictures() {
    this.removePictureQueue.forEach((pic) => {
      this._removePicture(pic);
    })
  }

  _removePicture(image) {
    if (image) {
      FileUtil.safeDeleteFile(image).catch(() => {});
    }
  }


  _pushCrownstoneItem(items, device, stone, stoneId, subtext = '') {
    items.push({
      mediumIcon: <IconCircle
        icon={device.config.icon}
        size={52}
        backgroundColor={stone.state.state > 0 && stone.reachability.disabled === false ? colors.green.hex : colors.menuBackground.hex}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: device.config.name,
      subtext: subtext,
      type: 'checkbar',
      showAddIcon: true,
      value: this.state.selectedStones[stoneId] === true,
      callback: () => {
        this.state.selectedStones[stoneId] = !this.state.selectedStones[stoneId] === true;
        this.setState({selectedStones: this.state.selectedStones})
      },
      style: {color: colors.iosBlue.hex},
    });
  }

  _getItems(floatingStones) {
    let items = [];
    items.push({label: lang("NEW_ROOM"), type:'explanation', below:false});
    items.push({label: lang("Room_Name"), type: 'textEdit', placeholder: lang("My_New_Room"), value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label: lang("Icon"), type: 'icon', value: this.state.icon,
      callback: () => {
        NavigationUtil.navigate("RoomIconSelection",{
          icon: this.state.icon,
          sphereId: this.props.sphereId,
          callback: (newIcon) => { this.setState({icon:newIcon}); }
        });
      }
    });
    items.push({
      label: lang("Picture"),
      type:  'picture',
      value: this.state.picture,
      forceAspectRatio: false,
      placeholderText: lang("Optional"),
      callback:(image) => {
        this.setState({picture:image}); },
      removePicture:() => {
        this.removePictureQueue.push(this.state.picture);
        this.setState({picture: null});
      }
    });

    let floatingStoneIds = Object.keys(floatingStones);
    floatingStoneIds.sort((a,b) => { return (floatingStones[a].device.config.name < floatingStones[b].device.config.name) ? -1 : 1 });

    let shownMovingStone = false;
    if (floatingStoneIds.length > 0) {
      items.push({label: lang("ADD_CROWNSTONES_TO_ROOM"), type:'explanation', below:false});
      let nearestId = this._getNearestStone(floatingStoneIds, floatingStones);
      floatingStoneIds.forEach((stoneId) => {
        // check if we have already shown the moving stone
        shownMovingStone = this.props.movingCrownstone === stoneId ? true : shownMovingStone;

        let device = floatingStones[stoneId].device;
        let stone = floatingStones[stoneId].stone;
        let subtext = stone.reachability.disabled === false ?
          (nearestId === stoneId ? 'Nearest' : stone.reachability.rssi > -60 ? 'Very near' : stone.reachability.rssi > -70 ? 'Near' : undefined)
          : undefined;

        this._pushCrownstoneItem(items, device, stone, stoneId, subtext);
      });
      items.push({label: lang("You_can_select_floating_C"), type:'explanation', below: true, style:{paddingBottom:0}});
    }

    if (shownMovingStone === false && this.props.movingCrownstone !== undefined) {
      items.push({label: lang("CURRENTLY_MOVING_CROWNSTO"), type:'explanation', below:false});
      let stoneId = this.props.movingCrownstone;
      let state = core.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[stoneId];
      let device = stone;
      if (stone.config.applianceId) {
        device = state.spheres[this.props.sphereId].appliances[stone.config.applianceId]
      }

      this._pushCrownstoneItem(items, device, stone, stoneId);
    }

    items.push({type:'spacer'});

    return items;
  }

  _getNearestStone(floatingStoneIds, floatingStones) {
    let rssi = -1000;
    let id = undefined;
    for (let i = 0; i < floatingStoneIds.length; i++) {
      let stone = floatingStones[floatingStoneIds[i]].stone;
      if (stone.reachability.rssi && rssi < stone.reachability.rssi && stone.reachability.disabled === false) {
        rssi = stone.reachability.rssi;
        id = floatingStoneIds[i];
      }
    }
    return id;
  }

  createRoom() {
    // make sure all text fields are blurred
    core.eventBus.emit("inputComplete");
    setTimeout(() => { this._createRoom(); }, 20);
  }

  _createRoom() {
    const state = core.store.getState();

    if (this.state.name.length === 0) {
      Alert.alert(
        lang("_Room_name_must_be_at_lea_header"),
        lang("_Room_name_must_be_at_lea_body"),
        [{text:lang("_Room_name_must_be_at_lea_left")}]
      )
    }
    else {
      // check if the room name is unique.
      let existingLocations = getLocationNamesInSphere(state, this.props.sphereId);
      if (existingLocations[this.state.name] === undefined) {
        core.eventBus.emit('showLoading', lang("Creating_room___"));
        let actions = [];
        let localId = xUtil.getUUID();

        actions.push({type:'ADD_LOCATION', sphereId: this.props.sphereId, locationId: localId, data:{name: this.state.name, icon: this.state.icon}});
        transferLocations.createOnCloud(actions, {
          localId: localId,
          localData: {
            config: {
              name: this.state.name,
              icon: this.state.icon,
            },
          },
          localSphereId: this.props.sphereId,
          cloudSphereId: MapProvider.local2cloudMap.spheres[this.props.sphereId]
        })
          .then(() => {
            // move the selected stones into the location.
            let floatingStoneIds = Object.keys(this.state.selectedStones);
            floatingStoneIds.forEach((floatingStoneId) => {
              if (this.state.selectedStones[floatingStoneId] === true) {
                actions.push({sphereId: this.props.sphereId, stoneId: floatingStoneId, type: "UPDATE_STONE_LOCATION", data: {locationId: localId}});
              }
            });

            // if we have a picture:
            if (this.state.picture !== null) {
              processImage(this.state.picture, localId + ".jpg", 1.0)
                .then((picture) => {
                  core.store.dispatch({
                    type:'UPDATE_LOCATION_CONFIG',
                    sphereId: this.props.sphereId,
                    locationId: localId,
                    data: {
                      picture: picture,
                      pictureTaken: new Date().valueOf(),
                      pictureId: null
                    }});
                })
            }

            core.store.batchDispatch(actions);
            if (this.props.returnToRoute) {
              NavigationUtil.back();
            }
            else {
              NavigationUtil.navigate("RoomOverview",{sphereId: this.props.sphereId, locationId: localId, title: this.state.name, seeStoneInSetupMode: false, __popBeforeAddCount: 2});
            }
            core.eventBus.emit('hideLoading');
          })
          .catch((err) => {
            LOGe.info("RoomAdd: Something went wrong with creation of rooms", err);
            let defaultActions = () => {core.eventBus.emit('hideLoading');};
            Alert.alert(
              lang("_Whoops___Something_went__header"),
              lang("_Whoops___Something_went__body"),
              [{text:lang("_Whoops___Something_went__left"), onPress: defaultActions}], { onDismiss: defaultActions })
          })
      }
      else {
        Alert.alert(
          lang("_Room_already_exists___Pl_header"),
          lang("_Room_already_exists___Pl_body"),
          [{text:lang("_Room_already_exists___Pl_left")}]
        );
      }
    }
  }

  render() {
    let state = core.store.getState();
    let backgroundImage = core.background.menu;

    if (!this.props.sphereId) {
      this.props.navigation.goBack(null);
      return <View />
    }

    let floatingStones = getStonesAndAppliancesInLocation(state, this.props.sphereId, null);
    let items = this._getItems(floatingStones);

    return (
      <Background image={backgroundImage} hasNavBar={ false } >
        <OrangeLine/>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems ref={this.refName} focusOnLoad={true} items={items} />
        </ScrollView>
      </Background>
    );
  }
}
