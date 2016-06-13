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

import { styles, colors } from './styles'


export class GroupOverview extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getColor(usage) {
    let minUsage = 0;
    let maxUsage = 400;

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

    let width = Dimensions.get('window').width;
    let radius = 0.35*0.5*width;


    // get the current usage.
    let usage = getCurrentUsageFromState(state, this.activeGroup, locationId);
    let presentUsers = getPresentUsersFromState(state, this.activeGroup, locationId);
    let color = this._getColor(usage);


    // TODO: Make dynamic
    let positions = {
      'locationId_A': {x:30, y:70},
      'locationId_D': {x:200, y:120},
      'locationId_B': {x:50, y:390},
      'locationId_C': {x:230, y:320},
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
    const store = this.props.store;
    const state = store.getState();

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
