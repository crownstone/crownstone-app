import React, { Component } from 'react'
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { getRoomName, getRoomNames, getRoomIdFromName } from './../../util/dataUtil'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'
import { NO_LOCATION_NAME } from '../../ExternalConfig'
import { CLOUD } from '../../cloud/cloudAPI'
import { BLEutil } from '../../native/BLEutil'
import { IconButton } from '../components/IconButton'
import { BleActions } from '../../native/Proxy'
import { LOG } from '../../logging/Log'


export class SettingsCrownstone extends Component {
  constructor() {
    super();
    this.deleting = false;
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      if (this.deleting === false) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];
    let requiredData = {groupId: this.props.groupId, stoneId: this.props.stoneId};

    const store = this.props.store;
    const state = store.getState();
    let stone = state.groups[this.props.groupId].stones[this.props.stoneId];

    let roomName = getRoomName(state, this.props.groupId, stone.config.locationId);
    let roomNames = Object.keys(getRoomNames(state, this.props.groupId));
    roomNames.push(NO_LOCATION_NAME); // add the location for no crownstones.

    let options = roomNames.map((roomName) => {return {label:roomName}});

    items.push({label:'CROWNSTONE', type: 'explanation',  below:false});
    items.push({
      label: 'Name', type: 'textEdit', placeholder:'Choose a nice name', value: stone.config.name, callback: (newText) => {
        store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {name: newText}});
      }
    });


    items.push({label:'LOCATION',  type:'explanation', below:false});
    if (roomNames.length == 1) {
      items.push({label:'First create rooms.',  type:'info', style:{color:colors.lightGray.hex}});
      items.push({type:'spacer'});
    }
    else {
      items.push({
        type:'dropdown',
        label:'In Room',
        value: roomName,
        // buttons:true,
        dropdownHeight:130,
        items:options,
        callback: (selectedRoom) => {
          if (selectedRoom !== roomName) {
            if (selectedRoom == NO_LOCATION_NAME) {
              Alert.alert("Decouple this Crownstone",
                "If you do not add the Crownstone to a room, it will not be used for indoor localization purposes.",
                [{text:'Cancel'}, {text:"OK", onPress: () => {
                  store.dispatch({...requiredData, type: "UPDATE_STONE_CONFIG", data: {locationId: null}})
                }}])
            }
            else {
              Alert.alert("Move Crownstone to " + selectedRoom,
                "If you move a Crownstone to a different room, we'd recommend you retrain the rooms to ensure the indoor localization will work correctly.",
                [{text:'Cancel'}, {text:"OK", onPress: () => {
                  let roomId = getRoomIdFromName(state, this.props.groupId, selectedRoom);
                  store.dispatch({...requiredData, type: "UPDATE_STONE_CONFIG", data: {locationId: roomId}})
                }}])
            }
          }
        }
      });
      items.push({label:'To ensure the indoor localization works correctly after moving a Crownstone, repeat the fingerprinting process.',  type:'explanation', below:true});
    }



    // TODO: DFU and firmware upgrades.
    // items.push({label:'FIRMWARE',  type:'explanation', style:{paddingTop:0}, below:false});
    // items.push({label:'Check for updates', style:{color: colors.blue.hex}, type:'button', callback:() => {Alert.alert("Up to date.","",[{text:"OK"}]}});
    // items.push({label:'This Crownstone is up to date.',  type:'explanation', below:true});

    items.push({
      label: 'Remove from Group',
      icon: <IconButton name="ios-trash" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      type: 'button',
      callback: () => {
        Alert.alert(
          "Are you sure?",
          "Removing a Crownstone from the group will revert it to it's factory default settings.",
          [{text: 'Cancel'}, {text: 'Remove', onPress: () => {
              Alert.alert(
                "Let\'s get started!",
                "Please put down your phone so we can remove and reset this Crownstone",
                [{text: 'Cancel'}, {text: 'Remove', onPress: () => {
                    this.props.eventBus.emit('showLoading', 'Looking for the Crownstone...');
                    this._removeCrownstone(stone);
                }}]
              )
          }}]
        )
      }
    });
    items.push({label:'Removing this Crownstone from its Group will reset it back to factory defaults.',  type:'explanation', below:true});

    return items;
  }


  _removeCrownstone(stone) {
    return new Promise((resolve, reject) => {
      BLEutil.detectCrownstone(stone.config.handle)
        .then((isInSetupMode) => {
          // if this crownstone is broadcasting but in setup mode, we only remove it from the cloud.
          if (isInSetupMode === true) {
            this._removeCloudOnly();
          }
          this._removeCloudReset(stone);
        })
        .catch((err) => {
          Alert.alert("Can't see this one!",
            "We can't find this Crownstone while scanning. Can you move closer to it and try again? If you want to remove it from your Group without resetting it, press Delete anyway.",
            [{text:'Delete anyway', onPress: () => {this._removeCloudOnly()}},
              {text:'OK', onPress: () => {this.props.eventBus.emit('hideLoading');}}])
        })
    })
  }


  _removeCloudOnly() {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forGroup(this.props.groupId).deleteStone(this.props.stoneId)
      .then(() => {
        this._removeCrownstoneFromRedux();
      })
      .catch((err) => {
        LOG("error while asking the cloud to remove this crownstone", err);
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Crownstone in the cloud. Please try again later",
          [{text:'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }

  _removeCloudReset(stone) {
    this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
    CLOUD.forGroup(this.props.groupId).deleteStone(this.props.stoneId)
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Factory resetting the Crownstone...');
        let proxy = BLEutil.getProxy(stone.config.handle);
        proxy.perform(BleActions.commandFactoryReset)
          .then(() => {
            this._removeCrownstoneFromRedux();
          })
          .catch((err) => {
            LOG("ERROR:",err)
            Alert.alert("Encountered a problem.",
              "We cannot Factory reset this Crownstone. Unfortunately, it has already been removed from the cloud. " +
              "You can recover it using the recovery procedure.",
              [{text:'OK', onPress: () => {
                this.props.eventBus.emit('hideLoading');
                Actions.pop();
                Actions.settingsPluginRecoverStep1();
              }}]
            )
          })
      })
      .catch((err) => {
        LOG("error while asking the cloud to remove this crownstone", err);
        Alert.alert("Encountered Cloud Issue.",
          "We cannot delete this Crownstone in the cloud. Please try again later",
          [{text:'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }

  _removeCrownstoneFromRedux() {
    // deleting makes sure we will not draw this page again if we delete it's source from the database.
    this.deleting = true;

    // revert to the previous screen
    Alert.alert("Success!",
      "We have removed this Crownstone from the Cloud, your Group and reverted it to factory defaults. After plugging it in and out once more, you can freely add it to a (new?) Group.",
      [{text:'OK', onPress: () => {
        Actions.pop();
        this.props.eventBus.emit('hideLoading');
        this.props.store.dispatch({type: "REMOVE_STONE", groupId: this.props.groupId, stoneId: this.props.stoneId});
      }
      }]
    )
  }

  render() {
    LOG("redrawing Crownstone settings page");
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
