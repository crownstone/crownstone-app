import React, { Component } from 'react' 
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { ProfilePicture } from './components/ProfilePicture'
import { Background } from './components/Background'
import { RoomCircle } from './components/RoomCircle'
import { getPresentUsersFromState, getCurrentPowerUsageFromState } from '../util/dataUtil'

import { styles, colors, width, height } from './styles'


export class GroupOverview extends Component {
  constructor() {
    super();
    this.renderState = {};
    this.state = {presentUsers: {}}

    // TODO: Make dynamic
    this.roomRadius = 0.35*0.5*width;
    this.userRadius = 25;
    let availableSpace = (height - 175) - this.roomRadius; // for top bar and menu bar

    this.roomPositions = {
      'locationId_A': {x:0.10*width, y:0.12*availableSpace},
      'locationId_D': {x:0.55*width, y:0.25*availableSpace},
      'locationId_B': {x:0.08*width, y:0.90*availableSpace},
      'locationId_C': {x:0.60*width, y:0.75*availableSpace},
    };

    this.presentUsers = {}
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
    });


    // debug for moving user around the rooms.
    // this.inRoom = 0;
    // setInterval(() => {
    //   const { store } = this.props;
    //   let state = store.getState();
    //   let activeGroup = state.app.activeGroup;
    //   let locations = state.groups[activeGroup].locations;
    //   let locationIds = Object.keys(state.groups[activeGroup].locations);
    //   let inRoom = this.inRoom;
    //   this.inRoom = (this.inRoom+1)%locationIds.length;
    //   let userId = 'memberId';
    //
    //   locationIds.forEach((otherLocationId) => {
    //     if (otherLocationId !== this.inRoom) {
    //       if (locations[otherLocationId].presentUsers.indexOf(userId) !== -1) {
    //         store.dispatch({type: "USER_EXIT", groupId: activeGroup, locationId: otherLocationId, data: {userId: userId}})
    //       }
    //     }
    //   });
    //   store.dispatch({type:"USER_ENTER", groupId: activeGroup, locationId: locationIds[this.inRoom], data:{userId: userId}})
    //
    // },1000)
  }


  componentWillUpdate(newProps) {
    // move the users over the board if they have changed between rooms.
    const store = newProps.store;
    const state = store.getState();
    this.activeGroup = state.app.activeGroup;
    const locations = state.groups[this.activeGroup].locations;
    let locationIds = Object.keys(locations);

    locationIds.forEach((locationId) => {
      // get the current usage.
      let presentUsers = getPresentUsersFromState(state, this.activeGroup, locationId);
      // console.log(presentUsers)
      presentUsers.forEach((user) => {
        if (this.state.presentUsers[user.id] === undefined) {
          this.state.presentUsers[user.id] = {top: new Animated.Value(-6*this.userRadius), left: new Animated.Value(-6*this.userRadius), location: locationId, data:user.data}
        }

        if (this.state.presentUsers[user.id].location !== locationId) {
          this._moveUser(user.id, locationId);
        }
      });
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


  _moveUser(userId, locationId) {
    // TODO: work with multiple users

    let corner = this.roomPositions[locationId];
    let roomHalfDiag = Math.sqrt(2*this.roomRadius*this.roomRadius); // can be optimized
    let userHalfDiag = Math.sqrt(2*this.userRadius*this.userRadius); // can be optimized

    let topPos = corner.y + (roomHalfDiag - this.roomRadius - userHalfDiag);
    let leftPos = corner.x + (roomHalfDiag - this.roomRadius- userHalfDiag);

    this.state.presentUsers[userId].location = locationId;

    Animated.spring(this.state.presentUsers[userId].top, {toValue: topPos, tension:50, friction:6}).start();
    Animated.spring(this.state.presentUsers[userId].left, {toValue: leftPos, tension:50, friction:6}).start();
  }

  _renderRoom(locationId, room) {
    const store = this.props.store;
    const state = store.getState();

    // get the current usage.
    let usage = getCurrentPowerUsageFromState(state, this.activeGroup, locationId);
    let color = this._getColor(usage);

    return (
      <TouchableHighlight onPress={() => Actions.roomOverview({
        groupId:this.activeGroup,
        locationId:locationId,
        title:room.config.name,
      })} key={locationId}>
        <View>
          <RoomCircle
            radius={this.roomRadius}
            color={color}
            icon={room.config.icon}
            content={{value:usage, unit:'W'}}
            pos={this.roomPositions[locationId]}
          /></View>
      </TouchableHighlight>
    );
  }

  _getRoomsAndUsers(rooms) {
    let roomNodes = [];
    Object.keys(rooms).sort().forEach((locationId) => {
      roomNodes.push(this._renderRoom(locationId, rooms[locationId]))
    });


    return roomNodes.concat(this.drawUsers());
  }

  drawUsers() {
    let userObjects = [];
    let users = Object.keys(this.state.presentUsers)
    users.forEach((userId) => {
      userObjects.push(
        <Animated.View key={userId} style={{position:'absolute', top:this.state.presentUsers[userId].top, left:this.state.presentUsers[userId].left}}>
          <ProfilePicture picture={this.state.presentUsers[userId].data.picture} size={2*this.userRadius} />
        </Animated.View>
      )
    });
    return userObjects
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
        <Background background={require('../images/mainBackgroundLight.png')}>{this._getRoomsAndUsers(rooms)}</Background>
      )
    }
  }
}
