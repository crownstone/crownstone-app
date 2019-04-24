
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

  componentDidMount(): void {
    NavigationUtil.backTo(this.props.returnToRoute)
  }

  refName : string;
  removePictureQueue = [];

  constructor(props) {
    super(props);
    this.refName = "listItems";

    this.state =  {name:'', icon: getRandomRoomIcon(), selectedStones: {}, picture: null};

    this.props.navigation.setParams({leftAction: () => { this.cancelEdit(); }, rightAction: () => { this.createRoom(); }})
  }

  cancelEdit() {
    // clean up any pictures that were taken
    this._removeUnusedPictures();
    this._removePicture(this.state.picture);
    NavigationUtil.back();
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

  _getItems() {
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


    items.push({type:'spacer'});

    return items;
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
              NavigationUtil.backTo(this.props.returnToRoute);
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
    let backgroundImage = core.background.menu;

    if (!this.props.sphereId) {
      NavigationUtil.back();
      return <View />
    }

    let items = this._getItems();

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
