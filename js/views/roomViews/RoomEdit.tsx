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
      title: "Edit Room",
      headerLeft: <CancelButton onPress={() => { params.leftAction ? params.leftAction() : BackAction() }}/>,
      headerRight: <TopbarButton
        text={"Save"}
        onPress={() => {
          params.rightAction ? params.rightAction() : () => {}
        }}
      />
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
        if (this.deleting === false) {
          BackAction();
        }
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
    this.deleting = true;
    this.props.eventBus.emit('showLoading','Removing this room in the Cloud...');
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

        // jump back to root
        this.props.eventBus.emit('hideLoading');
        Actions.popTo('sphereOverview');

        // reload fingerprints.
        LocationHandler.loadFingerprints();
      })
      .catch((err) => {
        this.deleting = false;
        let defaultAction = () => { this.props.eventBus.emit('hideLoading');};
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Room in the Cloud. Please try again later.",
          [{text:'OK', onPress: defaultAction }],
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

    items.push({label:'ROOM SETTINGS',  type:'explanation', below:false});
    items.push({
      label:'Room Name',
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
    items.push({label:'Icon', type: 'icon', value: room.config.icon, callback: () => {
      Actions.roomIconSelection({
        icon: this.state.icon,
        callback: (newIcon) => {
          this.setState({icon: newIcon});
        }
      })
    }});
    items.push({
      label: 'Picture',
      type:  'picture',
      value: this.state.picture,
      forceAspectRatio: false,
      placeholderText: 'Optional',
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
        items.push({label:'INDOOR LOCALIZATION', type: 'explanation',  below:false});
        // if a fingerprint is already present:
        if (room.config.fingerprintRaw) {
          items.push({label:'Retrain Room', type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />, callback: () => {
            Alert.alert('Retrain Room','Only do this if you experience issues with the indoor localization.',[
              {text: 'Cancel', style: 'cancel'},
              {text: 'OK', onPress: () => { Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId}); }}
            ])
          }});
          items.push({label:'If the indoor localization seems off or when you have moved Crownstones around, ' +
          'you can retrain this room so ' + ai + ' can find you again!', type: 'explanation',  below:true});
        }
        else {
          items.push({label:'Teach ' + ai + ' to find you!', type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, callback: () => {
            Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId});
          }});
          items.push({label:'Teach ' + ai + ' to identify when you\'re in this room by walking around in it.', type: 'explanation',  below:true});
        }
      }
      else if (canDoIndoorLocalization === true && this.viewingRemotely === true) {
        items.push({label:'You can only train this room if you are in this Sphere.', type: 'explanation',  below:false});
        items.push({type: 'spacer', height:30});
      }
      else {
        items.push({label:'Indoor localization on room-level is only possible when you have 4 or more Crownstones registered and placed in rooms.', type: 'explanation',  below:false});
        items.push({type: 'spacer', height:30});
      }
    }
    else {
      items.push({label:'Enable indoor localization in the app settings to be able to train this room.', type: 'explanation',  below:false});
      items.push({type: 'spacer', height:30});
    }


    if (Permissions.inSphere(this.props.sphereId).removeRoom) {
      items.push({
        label: 'Remove Room',
        type: 'button',
        icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.red.hex}}/>,
        callback: () => {
          Alert.alert("Are you sure?", "Removing this Room will make all contained Crownstones floating.",
            [{text: "Cancel", style: 'cancel'}, {
              text: 'Remove',
              style: 'destructive',
              onPress: this._removeRoom.bind(this)
            }])
        }
      });
      items.push({
        label: 'Removing this Room will make all contained Crownstones floating.',
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
      processImage(this.state.picture, this.props.locationId + ".jpg")
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
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false;

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
