
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { IconButton } from '../components/IconButton'
import {processImage, safeDeleteFile, Util} from '../../util/Util'
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import {colors, OrangeLine} from './../styles'
import { LocationHandler } from "../../native/localization/LocationHandler";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import {BackAction} from "../../util/Back";
import {CancelButton} from "../components/topbar/CancelButton";
import {TopbarButton} from "../components/topbar/TopbarButton";
import {eventBus} from "../../util/EventBus";



export class RoomEdit extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    return {
      title: lang("Edit_Room"),
      headerLeft: <CancelButton onPress={() => { params.leftAction ? params.leftAction() : BackAction() }}/>,
      headerRight: <TopbarButton
        text={ lang("Save")}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />,
      headerTruncatedBackTitle: lang("Back"),
    }
  };

  deleting : boolean = false;
  viewingRemotely : boolean = false;
  unsubscribeStoreEvents : any;

  removePictureQueue = [];
  pictureTaken = false;

  constructor(props) {
    super(props);

    const store = props.store;
    const state = store.getState();
    const room  = state.spheres[props.sphereId].locations[props.locationId];

    this.state = {
      name: room.config.name,
      icon: room.config.icon,
      picture: room.config.picture,
      pictureId: room.config.pictureId,
    };

    this.props.navigation.setParams({leftAction: () => { this.cancelEdit(); }, rightAction: () => { this._updateRoom(); }})
  }

  componentDidMount() {
    const { store } = this.props;
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      if ( change.updateLocationConfig && change.updateLocationConfig.locationIds[this.props.locationId] ||
           change.changeFingerprint ) {
        if (this.deleting === false) {
          this.forceUpdate();
        }
      }
    });

  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
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


  _removeRoom() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    let location = null;

    if (sphere) { location = sphere.locations[this.props.locationId]; }

    this.deleting = true;
    this.props.eventBus.emit('showLoading', lang("Removing_this_room_in_the"));
    CLOUD.forSphere(this.props.sphereId).deleteLocation(this.props.locationId)
      .then(() => {
        let removeActions = [];
        let stones = Util.data.getStonesInLocation(state, this.props.sphereId, this.props.locationId);
        let stoneIds = Object.keys(stones);
        removeActions.push({sphereId: this.props.sphereId, locationId: this.props.locationId, type: "REMOVE_LOCATION"});
        for (let i = 0; i < stoneIds.length; i++) {
          removeActions.push({sphereId: this.props.sphereId, stoneId: stoneIds[i], type: "UPDATE_STONE_CONFIG", data: {locationId: null}});
        }
        store.batchDispatch(removeActions);

        // remove all pictures that have been attempted except the one we will use.
        this._removeUnusedPictures()

        // remove the picture currently shown.
        this._removePicture(this.state.picture);

        // remove the picture that belongs to the location.
        if (location && location.config) {
          this._removePicture(location.config.picture)
        }

        // jump back to root
        this.props.eventBus.emit('hideLoading');
        BackAction('sphereOverview');

        // reload fingerprints.
        LocationHandler.loadFingerprints();
      })
      .catch((err) => {
        this.deleting = false;
        let defaultAction = () => { this.props.eventBus.emit('hideLoading');};
        Alert.alert(
lang("_Encountered_Cloud_Issue__header"),
lang("_Encountered_Cloud_Issue__body"),
[{text:lang("_Encountered_Cloud_Issue__left"), onPress: defaultAction }],
          { onDismiss: defaultAction }
        )
      });
  }


  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];

    let ai = state.spheres[this.props.sphereId].config.aiName;

    let items = [];

    items.push({label: lang("ROOM_SETTINGS"),  type:'explanation', below:false});
    items.push({
      label: lang("Room_Name"),
      type: 'textEdit',
      value: this.state.name,
      callback: (newText) => {
        this.setState({name: newText});
      },
      endCallback: (newText) => {
        newText = (newText === '') ? 'Untitled Room' : newText;
        this.setState({name: newText});
      }
    });
    items.push({label: lang("Icon"), type: 'icon', value: this.state.icon, callback: () => {
      Actions.roomIconSelection({
        icon: this.state.icon,
        callback: (newIcon) => {
          this.setState({icon: newIcon});
        }
      })
    }});
    items.push({
      label: lang("Picture"),
      type:  'picture',
      value: this.state.picture,
      forceAspectRatio: false,
      placeholderText: lang("Optional"),
      callback:(image) => {
        this.pictureTaken = true; this.setState({picture:image}); },
      removePicture:() => {
        this.removePictureQueue.push(this.state.picture);
        this.setState({picture: null});
      }
    })


    // here we do the training if required and possible.
    if (state.app.indoorLocalizationEnabled) {
      let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
      if (canDoIndoorLocalization === true && this.viewingRemotely === false) {
        items.push({label: lang("INDOOR_LOCALIZATION"), type: 'explanation',  below:false});
        // if a fingerprint is already present:
        if (room.config.fingerprintRaw) {
          items.push({label: lang("Retrain_Room"), type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />, callback: () => {
            Alert.alert(
lang("_Retrain_Room__Only_do_th_header"),
lang("_Retrain_Room__Only_do_th_body"),
[{text: lang("_Retrain_Room__Only_do_th_left"), style: 'cancel'},
              {
text: lang("_Retrain_Room__Only_do_th_right"), onPress: () => { Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId}); }}
            ])
          }});
          items.push({label: lang("If_the_indoor_localizatio",ai), type: 'explanation',  below:true});
        }
        else {
          items.push({label: lang("Teach__to_find_you_",ai), type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, callback: () => {
            Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId});
          }});
          items.push({label: lang("Teach__to_identify_when_y",ai), type: 'explanation',  below:true});
        }
      }
      else if (canDoIndoorLocalization === true && this.viewingRemotely === true) {
        items.push({label: lang("You_can_only_train_this_r"), type: 'explanation',  below:false});
        items.push({type: 'spacer', height:30});
      }
      else {
        items.push({label: lang("Indoor_localization_on_ro"), type: 'explanation',  below:false});
        items.push({type: 'spacer', height:30});
      }
    }
    else {
      items.push({label: lang("Enable_indoor_localizatio"), type: 'explanation',  below:false});
      items.push({type: 'spacer', height:30});
    }


    if (Permissions.inSphere(this.props.sphereId).removeRoom) {
      items.push({
        label: lang("Remove_Room"),
        type: 'button',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.red.hex}}/>,
        callback: () => {
          Alert.alert(
lang("_Are_you_sure___Removing__header"),
lang("_Are_you_sure___Removing__body"),
[{text: lang("_Are_you_sure___Removing__left"), style: 'cancel'}, {
              
text: lang("_Are_you_sure___Removing__right"),
              style: 'destructive',
              onPress: this._removeRoom.bind(this)
            }])
        }
      });
      items.push({
        label: lang("Removing_this_Room_will_m"),
        type: 'explanation',
        below: true
      });
    }

    return items;
  }

  _updateRoom() {
    const store = this.props.store;
    const state = store.getState();
    const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];

    // remove all pictures that have been attempted except the one we will use.
    this._removeUnusedPictures()

    if (this.pictureTaken) {
      processImage(this.state.picture, this.props.locationId + ".jpg", 1.0)
        .then((picture) => {
          this.props.store.dispatch({
            type:'UPDATE_LOCATION_CONFIG',
            sphereId: this.props.sphereId,
            locationId: this.props.locationId,
            data: {
              picture: picture,
              pictureTaken: new Date().valueOf(),
              pictureId: null
            }});
        })
    }

    if (room.config.picture !== this.state.picture && this.state.picture === null) {
      this._removePicture(room.config.picture);
      this.props.store.dispatch({
        type:'UPDATE_LOCATION_CONFIG',
        sphereId: this.props.sphereId,
        locationId: this.props.locationId,
        data: {
          picture: null,
          pictureTaken: null,
          pictureId: null
        }});
    }


    if (room.config.name !== this.state.name || room.config.icon !== this.state.icon) {
      this.props.store.dispatch({
        type:'UPDATE_LOCATION_CONFIG',
        sphereId: this.props.sphereId,
        locationId: this.props.locationId,
        data: {
          name: this.state.name,
          icon: this.state.icon
        }});
    }
    BackAction();
  }

  cancelEdit() {
    const store = this.props.store;
    const state = store.getState();
    const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];

    // remove all pictures that have been attempted except the one we will use.
    this.removePictureQueue.forEach((pic) => {
      if (pic !== room.config.picture) {
        this._removePicture(pic);
      }
    })

    if (this.pictureTaken) {
      this._removePicture(this.state.picture)
    }

    BackAction();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    this.viewingRemotely = state.spheres[this.props.sphereId].state.present === false;

    let backgroundImage = this.props.getBackground('menu', this.viewingRemotely);
    return (
      <Background hasNavBar={false} image={backgroundImage}>
        <OrangeLine/>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
