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
import { BleActions } from '../../native/Proxy'

export class SettingsCrownstone extends Component {


  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];

    const store = this.props.store;
    const state = store.getState();
    let stone = state.groups[this.props.groupId].stones[this.props.stoneId];

    let roomName = getRoomName(state, this.props.groupId, stone.config.locationId);
    let roomNames = Object.keys(getRoomNames(state, this.props.groupId));
    roomNames.push(NO_LOCATION_NAME); // add the location for no crownstones.

    let options = roomNames.map((roomName) => {return {label:roomName}});

    items.push({label:'LOCATION OF CROWNSTONE',  type:'explanation', below:false});
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
                  store.dispatch({groupId: this.props.groupId, stoneId: this.props.stoneId, type: "UPDATE_STONE_CONFIG", data: {locationId: null}})
                }}])
            }
            else {
              Alert.alert("Move Crownstone to " + selectedRoom,
                "If you move a Crownstone to a different room, we'd recommend you redo the fingerprints to ensure the indoor localization will work correctly.",
                [{text:'Cancel'}, {text:"OK", onPress: () => {
                  let roomId = getRoomIdFromName(state, this.props.groupId, selectedRoom);
                  store.dispatch({groupId: this.props.groupId, stoneId: this.props.stoneId, type: "UPDATE_STONE_CONFIG", data: {locationId: roomId}})
                }}])
            }


          }
        }
      }
    );
    items.push({label:'To ensure the indoor localization works correctly after moving a Crownstone, repeat the fingerprinting process.',  type:'explanation', below:true});

    // TODO: DFU and firmware upgrades.
    // items.push({label:'FIRMWARE',  type:'explanation', style:{paddingTop:0}, below:false});
    // items.push({label:'Check for updates', style:{color: colors.blue.hex}, type:'button', callback:() => {Alert.alert("Up to date.","",[{text:"OK"}]}});
    // items.push({label:'This Crownstone is up to date.',  type:'explanation', below:true});

    items.push({label:'DANGER',  type:'explanation', style:{paddingTop:0}, below:false});
    items.push({
      label: 'Remove from Group',
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
    BLEutil.detectCrownstone(stone.config.bluetoothId)
      .then(() => {
        this.props.eventBus.emit('showLoading', 'Removing the Crownstone from the Cloud...');
        CLOUD.forGroup(this.props.groupId).deleteStone(this.props.stoneId)
          .then(() => {
            this.props.eventBus.emit('showLoading', 'Factory resetting the Crownstone...');
            let proxy = BLEutil.getProxy(stone.config.bluetoothId);
            proxy.perform(BleActions.factoryReset())
              .then(() => {
                this._removeCrownstoneFromRedux();
              })
              .catch((err) => {
                this.props.eventBus.emit('showLoading', 'Trying again...');
                return new Promise((resolve, reject) => {
                  setTimeout(() => {
                    proxy.perform(BleActions.factoryReset())
                      .then(() => {
                        resolve();
                      })
                      .catch((err) => {
                        reject(err);
                      })
                  }, 1000);
                })
              })
              .then(() => {
                this._removeCrownstoneFromRedux();
              })
              .catch((err) => {
                Alert.alert("Encountered a problem.",
                  "We cannot Factory reset this Crownstone. Unfortunately, it has already been removed from the cloud. " +
                  "You can recover it using the recovery procedure.", [{text:'OK', onPress: () => {
                    this.props.eventBus.emit('hideLoading');}
                  }])
              })
          })
          .catch((err) => {
            console.log("error while asking the cloud to remove this crownstone", err);
            Alert.alert("Encountered Cloud Issue.",
              "We cannot delete this Crownstone in the cloud. Please try again later",
              [{text:'OK', onPress: () => {
                this.props.eventBus.emit('hideLoading');}
              }])
          })

      })
      .catch((err) => {
        Alert.alert("Can't see this one!",
          "We can't find this Crownstone while scanning. Can you move closer to it and try again?",
          [{text:'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');}
          }])
      })
  }

  _removeCrownstoneFromRedux() {
    store.dispatch({type: "REMOVE_STONE", groupId: this.props.groupId, stoneId: this.props.stoneId});
    this.props.eventBus.emit('hideLoading');
  }

  render() {
    console.log("redrawing Crownstone settings page");
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
