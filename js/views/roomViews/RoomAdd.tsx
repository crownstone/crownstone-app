import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  Platform,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { IconCircle } from '../components/IconCircle'
import { ListEditableItems } from '../components/ListEditableItems'
import { getLocationNamesInSphere, getStonesAndAppliancesInLocation } from '../../util/DataUtil'
import { LOG } from '../../logging/Log'
const Actions = require('react-native-router-flux').Actions;
import {colors, OrangeLine} from '../styles'
import {processImage, safeDeleteFile, Util} from "../../util/Util";
import {transferLocations} from "../../cloud/transferData/transferLocations";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BackAction} from "../../util/Back";
import {TopbarButton} from "../components/topbar/TopbarButton";
import {CancelButton} from "../components/topbar/CancelButton";



export class RoomAdd extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: "Create Room",
      headerLeft: <CancelButton onPress={() => { params.leftAction ? params.leftAction() : BackAction() }}/>,
      headerRight: <TopbarButton
        text={"Create"}
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
    let initialState = {name:'', icon: 'c1-bookshelf', selectedStones: {}, picture: null};
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
    this._removePicture(this.state.picture)
    BackAction();
  }

  _removeUnusedPictures() {
    this.removePictureQueue.forEach((pic) => {
      this._removePicture(pic);
    })
  }

  _removePicture(image) {
    if (image) {
      safeDeleteFile(image).catch(() => {});
    }
  }


  _pushCrownstoneItem(items, device, stone, stoneId, subtext = '') {
    items.push({
      mediumIcon: <IconCircle
        icon={device.config.icon}
        size={52}
        backgroundColor={stone.state.state > 0 && stone.config.disabled === false ? colors.green.hex : colors.menuBackground.hex}
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
    items.push({label:'NEW ROOM', type:'explanation', below:false});
    items.push({label:'Room Name', type: 'textEdit', placeholder:'My New Room', value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label:'Icon', type: 'icon', value: this.state.icon,
      callback: () => {
        Actions.roomIconSelection({
          icon: this.state.icon,
          sphereId: this.props.sphereId,
          callback: (newIcon) => { this.setState({icon:newIcon}); }
        }
      )}
    });
    items.push({
      label: 'Picture',
      type:  'picture',
      value: this.state.picture,
      forceAspectRatio: false,
      placeholderText: 'Optional',
      callback:(image) => {
        this.setState({picture:image}); },
      removePicture:() => {
        this.removePictureQueue.push(this.state.picture);
        this.setState({picture: null});
      }
    })

    let floatingStoneIds = Object.keys(floatingStones);
    floatingStoneIds.sort((a,b) => { return (floatingStones[a].device.config.name < floatingStones[b].device.config.name) ? -1 : 1 })

    let shownMovingStone = false;
    if (floatingStoneIds.length > 0) {
      items.push({label:'ADD CROWNSTONES TO ROOM', type:'explanation', below:false});
      let nearestId = this._getNearestStone(floatingStoneIds, floatingStones);
      floatingStoneIds.forEach((stoneId) => {
        // check if we have already shown the moving stone
        shownMovingStone = this.props.movingCrownstone === stoneId ? true : shownMovingStone;

        let device = floatingStones[stoneId].device;
        let stone = floatingStones[stoneId].stone;
        let subtext = stone.config.disabled === false ?
          (nearestId === stoneId ? 'Nearest' : stone.config.rssi > -60 ? 'Very near' : stone.config.rssi > -70 ? 'Near' : undefined)
          : undefined;

        this._pushCrownstoneItem(items, device, stone, stoneId, subtext);
      });
      items.push({label:'You can select floating Crownstones to immediately add them to this new room!', type:'explanation', below: true, style:{paddingBottom:0}});
    }

    if (shownMovingStone === false && this.props.movingCrownstone !== undefined) {
      items.push({label:'CURRENTLY MOVING CROWNSTONE', type:'explanation', below:false});
      let stoneId = this.props.movingCrownstone;
      let state = this.props.store.getState();
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
      if (stone.config.rssi && rssi < stone.config.rssi && stone.config.disabled === false) {
        rssi = stone.config.rssi;
        id = floatingStoneIds[i];
      }
    }
    return id;
  }

  createRoom() {
    // make sure all text fields are blurred
    this.props.eventBus.emit("inputComplete");
    setTimeout(() => { this._createRoom(); }, 20);
  }

  _createRoom() {
    const state = this.props.store.getState();

    if (this.state.name.length === 0) {
      Alert.alert(
        'Room name must be at least 1 character long.',
        'Please change the name and try again.',
        [{text:'OK'}]
      )
    }
    else {
      // check if the room name is unique.
      let existingLocations = getLocationNamesInSphere(state, this.props.sphereId);
      if (existingLocations[this.state.name] === undefined) {
        this.props.eventBus.emit('showLoading', 'Creating room...');
        let actions = [];
        let localId = Util.getUUID();

        // todo Move to create new location method once it is implemented in transferLocations
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
                  this.props.store.dispatch({
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

            this.props.store.batchDispatch(actions);
            if (this.props.returnToCrownstone) {
              Actions.popTo("deviceOverview");
            }
            else {
              Actions.roomOverview({sphereId: this.props.sphereId, locationId: localId, title: this.state.name, seeStoneInSetupMode: false, __popBeforeAddCount: 2});
            }
            this.props.eventBus.emit('hideLoading');
          })
          .catch((err) => {
            LOG.error("RoomAdd: Something went wrong with creation of rooms", err);
            let defaultActions = () => {this.props.eventBus.emit('hideLoading');};
            Alert.alert("Whoops!", "Something went wrong, please try again later!",[{text:"OK", onPress: defaultActions}], { onDismiss: defaultActions })
          })
      }
      else {
        Alert.alert(
          'Room already exists.',
          'Please change the name and try again.',
          [{text:'OK'}]
        );
      }
    }
  }

  render() {
    let state = this.props.store.getState();
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    if (!this.props.sphereId) {
      BackAction();
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
