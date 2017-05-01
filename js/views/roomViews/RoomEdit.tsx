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
import { Util } from '../../util/Util'
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { styles, colors } from './../styles'
import { LOG } from './../../logging/Log'



export class RoomEdit extends Component<any, any> {
  deleting : boolean = false;
  viewingRemotely : boolean = false;
  unsubscribeStoreEvents : any;

  constructor() {
    super();
    this.unsubscribeStoreEvents = undefined;
  }

  componentDidMount() {
    const { store } = this.props;
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        Actions.pop();
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
        (Actions as any).sphereOverview({type:'reset'});
      })
      .catch((err) => {
        this.deleting = false;
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Room in the Cloud. Please try again later.",
          [{text:'OK', onPress: () => { this.props.eventBus.emit('hideLoading');} }])
      });
  }


  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    const room  = state.spheres[this.props.sphereId].locations[this.props.locationId];

    let ai = state.spheres[this.props.sphereId].config.aiName;

    let requiredData = {sphereId: this.props.sphereId, locationId: this.props.locationId};
    let items = [];

    items.push({label:'ROOM SETTINGS',  type:'explanation', below:false});
    items.push({label:'Room Name', type: 'textEdit', value: room.config.name, callback: (newText) => {
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }, endCallback: (newText) => {
      newText = (newText === '') ? 'Untitled Room' : newText;
      store.dispatch({...requiredData, ...{type:'UPDATE_LOCATION_CONFIG', data:{name:newText}}});
    }});
    items.push({label:'Icon', type: 'icon', value: room.config.icon, callback: () => {
      (Actions as any).roomIconSelection({locationId: this.props.locationId, icon: room.config.icon, sphereId: this.props.sphereId})
    }});


    // here we do the training if required and possible.
    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
    if (canDoIndoorLocalization === true && this.viewingRemotely === false) {
      items.push({label:'INDOOR LOCALIZATION', type: 'explanation',  below:false});
      if (room.config.fingerprintRaw) {
        items.push({label:'Retrain Room', type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.iosBlue.hex}} />, callback: () => {
          Alert.alert('Retrain Room','Only do this if you experience issues with the indoor localization.',[
            {text: 'Cancel', style: 'cancel'},
            {text: 'OK', onPress: () => { (Actions as any).roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId}); }}
          ])
        }});
        items.push({label:'If the indoor localization seems off or when you have moved Crownstones around, ' +
        'you can retrain this room so ' + ai + ' can find you again!', type: 'explanation',  below:true});
      }
      else {
        items.push({label:'Teach ' + ai + ' to find you!', type: 'navigation', icon: <IconButton name="c1-locationPin1" size={19} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />, callback: () => {
          (Actions as any).roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId});
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

    items.push({
      label: 'Remove Room',
      type: 'button',
      icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback: () => {
        Alert.alert("Are you sure?","Removing this Room will make all contained Crownstones floating.",
          [{text: "Cancel", style: 'cancel'}, {text:'Remove', style: 'destructive', onPress: this._removeRoom.bind(this)}])
      }
    });
    items.push({label:'Removing this Room will make all contained Crownstones floating.',  type:'explanation', below:true});

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    this.viewingRemotely = state.spheres[this.props.sphereId].config.present === false;

    let backgroundImage = this.props.getBackground('menu', this.viewingRemotely);
    return (
      <Background image={backgroundImage} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
