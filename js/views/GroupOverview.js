import React, { Component } from 'react' 
import {
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './components/Background'
import { RoomCircle } from './components/RoomCircle'
import { getPresentUsersFromState, getCurrentUsageFromState } from '../util/dataUtil'

import { styles, colors, width, height } from './styles'


export class GroupOverview extends Component {
  constructor() {
    super();
    this.renderState = {};
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // const state = store.getState();
      // if (this.renderState && this.renderState.groups != state.groups) {
      //   this.renderState = state;
        // console.log("Force Update")
        this.forceUpdate();
      // }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   console.log("Should component update?",nextProps, nextState)
  //   return true
  // }


  _getColor(usage) {
    let minUsage = 0;
    let maxUsage = 30;

    let blendFactor = (Math.min(maxUsage, usage) -  minUsage) / maxUsage;

    return {
      r: blendFactor * colors.red.r + (1-blendFactor) * colors.green.r,
      g: blendFactor * colors.red.g + (1-blendFactor) * colors.green.g,
      b: blendFactor * colors.red.b + (1-blendFactor) * colors.green.b,
    }
  }


  _renderRoom(locationId, room) {
    const store = this.props.store;
    const state = store.getState();


    let radius = 0.35*0.5*width;
    let availableSpace = (height - 175)-radius; // for top bar and menu bar


    // get the current usage.
    let usage = getCurrentUsageFromState(state, this.activeGroup, locationId);
    let presentUsers = getPresentUsersFromState(state, this.activeGroup, locationId);
    let color = this._getColor(usage);


    // TODO: Make dynamic
    let positions = {
      'locationId_A': {x:0.10*width, y:0.12*availableSpace},
      'locationId_D': {x:0.55*width, y:0.25*availableSpace},
      'locationId_B': {x:0.08*width, y:0.90*availableSpace},
      'locationId_C': {x:0.60*width, y:0.75*availableSpace},
    };

    return (
      <TouchableHighlight onPress={() => Actions.roomOverview({
        groupId:this.activeGroup,
        locationId:locationId,
        title:room.config.name,
      })} key={locationId}>
        <View>
          <RoomCircle
            radius={radius}
            color={color}
            icon={room.config.icon}
            content={{value:usage, unit:'W'}}
            pos={positions[locationId]}
            presentUsers={presentUsers}
          /></View>
      </TouchableHighlight>
    );
  }

  _getRooms(rooms) {
    let roomNodes = [];
    Object.keys(rooms).sort().forEach((locationId) => {
      roomNodes.push(this._renderRoom(locationId, rooms[locationId]))
    });
    return roomNodes;
  }

  render() {
    console.log("RENDERING OVERVIEW")
    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;

    if (state.app.activeGroup === undefined) {
      return (
        <Background background={require('../images/mainBackgroundLight.png')}>
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>Trying to detect Group...</Text>
          </View>
        </Background>
      );
    }
    else {
      this.activeGroup = state.app.activeGroup;
      const rooms = state.groups[this.activeGroup].locations;
      if (Object.keys(rooms).length === 0) {
        return (
          <Background background={require('../images/mainBackgroundLight.png')}>
            <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
              <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>No rooms defined yet.</Text>
              <Text style={{backgroundColor:'transparent', color:'rgba(255,255,255,0.5)', fontSize:30}}>Tap here to add them!</Text>
            </View>
          </Background>
        );
      }
      return (
        <Background background={require('../images/mainBackgroundLight.png')}>{this._getRooms(rooms)}</Background>
      )
    }
  }
}
