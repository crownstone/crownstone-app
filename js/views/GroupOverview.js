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
import { hsv2rgb, hsl2rgb, hcl2rgb } from '../util/colorConverters'
import { getPresentUsersFromState, getCurrentPowerUsageFromState } from '../util/dataUtil'

import { styles, colors, width, height } from './styles'


export class GroupOverview extends Component {
  constructor() {
    super();
    this.renderState = {};
    this.state = {presentUsers: {}};

    this.roomRadius = 0.35*0.5*width;
    this.userRadius = 25;
    let availableSpace = (height - 175) - this.roomRadius; // for top bar and menu bar

    this.roomPositions = {
      locationId_A: {x:0.10*width, y:0.12*availableSpace},
      locationId_D: {x:0.55*width, y:0.25*availableSpace},
      locationId_B: {x:0.08*width, y:0.90*availableSpace},
      locationId_C: {x:0.60*width, y:0.75*availableSpace}
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
  }

  componentWillUpdate(newProps) {
    const store = newProps.store;
    this._updateUsers(store);
  }

  _updateUsers(store) {
    // move the users over the board if they have changed between rooms.
    const state = store.getState();
    this.activeGroup = state.app.activeGroup;
    const locations = state.groups[this.activeGroup].locations;
    let locationIds = Object.keys(locations);

    locationIds.forEach((locationId) => {
      // get the current usage.
      let presentUsers = getPresentUsersFromState(state, this.activeGroup, locationId);
      //console.log("users in area",presentUsers)
      presentUsers.forEach((user) => {
        if (this.state.presentUsers[user.id] === undefined) {
          this.state.presentUsers[user.id] = {location: locationId, data:user.data};
          this._moveUser(user.id, locationId, false);
        }

        if (this.state.presentUsers[user.id].location !== locationId) {
          this._moveUser(user.id, locationId, true);
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
    let maxUsage = 400;

    let blendFactor = (Math.min(maxUsage, usage) -  minUsage) / maxUsage;

    let endColor = colors.green.rgb;
    let startColor = colors.blue.rgb;
    if (blendFactor > 0.5) {
      endColor = colors.red.rgb;
      startColor = colors.green.rgb;
    }

    let blend = {
      r: blendFactor * endColor.r + (1-blendFactor) * startColor.r,
      g: blendFactor * endColor.g + (1-blendFactor) * startColor.g,
      b: blendFactor * endColor.b + (1-blendFactor) * startColor.b
    };

    return blend;
  }


  _moveUser(userId, locationId, animate = false) {
    // TODO: work with multiple users

    let corner = this.roomPositions[locationId];
    let roomHalfDiag = Math.sqrt(2*this.roomRadius*this.roomRadius); // can be optimized
    let userHalfDiag = Math.sqrt(2*this.userRadius*this.userRadius); // can be optimized

    let topPos = corner.y + (roomHalfDiag - this.roomRadius - userHalfDiag);
    let leftPos = corner.x + (roomHalfDiag - this.roomRadius- userHalfDiag);

    this.state.presentUsers[userId].location = locationId;

    if (animate === false) {
      this.state.presentUsers[userId].top = new Animated.Value(topPos);
      this.state.presentUsers[userId].left = new Animated.Value(leftPos);
    }
    else {
      Animated.spring(this.state.presentUsers[userId].top, {toValue: topPos, tension: 50, friction: 6}).start();
      Animated.spring(this.state.presentUsers[userId].left, {toValue: leftPos, tension: 50, friction: 6}).start();
    }
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
    const store = this.props.store;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;
    let userObjects = [];
    let users = Object.keys(this.state.presentUsers);
    users.forEach((userId) => {
      userObjects.push(
        <Animated.View key={userId} style={{position:'absolute', top:this.state.presentUsers[userId].top, left:this.state.presentUsers[userId].left}}>
          <ProfilePicture picture={state.groups[activeGroup].members[userId].picture} size={2*this.userRadius} />
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

    console.log(state)
    if (state.app.activeGroup === undefined || true) {
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
      // update the users
      this._updateUsers(store);
      return (
        <Background background={require('../images/mainBackgroundLight.png')}>{this._getRoomsAndUsers(rooms)}</Background>
      )
    }
  }
}
