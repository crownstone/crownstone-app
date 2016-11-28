import React, {Component} from 'react'
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  ScrollView,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

let Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler } from '../../native/SetupStateHandler'
import { RoomCircle }        from '../components/RoomCircle'
import { getFloatingStones, getAmountOfStonesInLocation } from '../../util/dataUtil'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'
import { LOG }               from '../../logging/Log'


export class RoomLayer extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}};

    this.roomRadius = 0.35 * 0.5 * screenWidth;
    this.availableSpace = (screenHeight - topBarHeight - tabBarHeight - 35) - 2 * this.roomRadius; // for top bar, menu bar and text + orbs

    this.roomPositions = {
      1: [
        {x: 0.5 * screenWidth - this.roomRadius, y: 0.5 * this.availableSpace},
      ],
      2: [
        {x: 0.15 * screenWidth, y: 0.20 * this.availableSpace},
        {x: 0.50 * screenWidth, y: 0.80 * this.availableSpace}
      ],
      3: [
        {x: 0.12 * screenWidth, y: 0.12 * this.availableSpace},
        {x: 0.55 * screenWidth, y: 0.48 * this.availableSpace},
        {x: 0.08 * screenWidth, y: 0.88 * this.availableSpace},
      ],
      4: [
        {x: 0.10 * screenWidth, y: 0.12 * this.availableSpace},
        {x: 0.55 * screenWidth, y: 0.25 * this.availableSpace},
        {x: 0.08 * screenWidth, y: 0.90 * this.availableSpace},
        {x: 0.60 * screenWidth, y: 0.75 * this.availableSpace}
      ],
      5: [
        {x: 0.12 * screenWidth, y: 0.08 * this.availableSpace},
        {x: 0.06 * screenWidth, y: 0.50 * this.availableSpace},
        {x: 0.55 * screenWidth, y: 0.25 * this.availableSpace},
        {x: 0.14 * screenWidth, y: 0.94 * this.availableSpace},
        {x: 0.60 * screenWidth, y: 0.75 * this.availableSpace}
      ],
      6: [
        {x: 0.08 * screenWidth, y: 0.06 * this.availableSpace},
        {x: 0.08 * screenWidth, y: 0.16 * this.availableSpace + 2.0 * this.roomRadius},
        {x: 0.08 * screenWidth, y: 0.26 * this.availableSpace + 4.0 * this.roomRadius},
        {x: 0.57 * screenWidth, y: 0.14 * this.availableSpace},
        {x: 0.57 * screenWidth, y: 0.24 * this.availableSpace + 2.0 * this.roomRadius},
        {x: 0.57 * screenWidth, y: 0.34 * this.availableSpace + 4.0 * this.roomRadius}
      ],
    };
  }

  componentDidMount() {}

  componentWillUnmount() {}

  _renderRoom(locationId, count, index, activeSphere) {
    // get the position for the room
    let pos = {};
    if (count > 6) {
      if (index % 2 == 0) {
        pos = {
          x: 0.08 * screenWidth,
          y: 0.06 * this.availableSpace + Math.floor(index / 2) * 0.1 * this.availableSpace + Math.floor(index / 2) * 2 * this.roomRadius
        }
      }
      else {
        pos = {
          x: 0.57 * screenWidth,
          y: 0.14 * this.availableSpace + Math.floor(index / 2) * 0.1 * this.availableSpace + Math.floor(index / 2) * 2 * this.roomRadius
        }
      }
    }
    else {
      pos = this.roomPositions[count][index];
    }
    this.maxY = Math.max(this.maxY, pos.y);

    // variables to pass to the room overview
    let actionsParams = {
      sphereId: this.props.sphereId,
      locationId: locationId,
    };

    return (
      <RoomCircle
        eventBus={this.props.eventBus}
        locationId={locationId}
        active={this.props.sphereId == activeSphere}
        totalAmountOfRoomCircles={count}
        sphereId={this.props.sphereId}
        radius={this.roomRadius}
        store={this.props.store}
        pos={pos}
        seeStonesInSetupMode={this.props.seeStonesInSetupMode}
        viewingRemotely={this.props.viewingRemotely}
        key={locationId || 'floating'}
        actionParams={actionsParams}
      />
    );
  }

  getRooms() {
    this.maxY = 0;
    const store = this.props.store;
    const state = store.getState();
    let rooms = state.spheres[this.props.sphereId].locations;

    let floatingStones = getFloatingStones(state, this.props.sphereId);
    let showFloatingCrownstones = floatingStones.length > 0 || SetupStateHandler.areSetupStonesAvailable() === true;

    let roomNodes = [];
    let roomIdArray = Object.keys(rooms).sort();

    let amountOfRooms = roomIdArray.length;

    // the orphaned stones room.
    if (showFloatingCrownstones) {
      amountOfRooms += 1;
    }

    for (let i = 0; i < roomIdArray.length; i++) {
      roomNodes.push(this._renderRoom(roomIdArray[i], amountOfRooms, i, state.app.activeSphere))
    }

    if (showFloatingCrownstones) {
      roomNodes.push(this._renderRoom(null, amountOfRooms, amountOfRooms - 1, state.app.activeSphere))
    }

    if (roomNodes.length > 6) {
      return (
        <ScrollView style={{height: screenHeight, width: screenWidth}}>
          <View style={{height: this.maxY + 2 * this.roomRadius + 200}}>
            {roomNodes}
          </View>
        </ScrollView>
      )
    }
    else {
      return roomNodes;
    }
  }

  render() {
    if (this.props.sphereId === null) {
      return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
    }
    else {
      return (
        <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}}>
          {this.getRooms()}
        </View>
      )
    }
  }
}
