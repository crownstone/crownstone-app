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
    console.log(stone.config.locationId)
    let roomName = getRoomName(state, this.props.groupId, stone.config.locationId);
    console.log(roomName)
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
          [{text:'Cancel'},{text:'Remove', onPress:() => {
           // TODO: Implement removal from group.
        }}])
      }
    });
    items.push({label:'Removing this Crownstone from its Group will reset it back to factory defaults.',  type:'explanation', below:true});

    return items;
  }

  render() {
    console.log("redrawing corwnsotn")
    return (
      <Background>
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
