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

import { styles, width, height, colors } from '../styles'
import { getPresentUsersFromState, getCurrentPowerUsageFromState } from '../../util/dataUtil'
import { ProfilePicture } from './ProfilePicture'
import { TextCircle } from './TextCircle'



export class PresentUsers extends Component {
  constructor(props) {
    super();
    this.renderState = {};

    let roomRadius = props.roomRadius;
    let roomRadiusForBase = 1.5 * roomRadius;
    this.userDiameter = 40;
    let userRadius = 0.5 * this.userDiameter;

    this.basePositions = {
      owner: {x:-roomRadius, y:-roomRadius},
      '1': [
        {x: roomRadius + roomRadiusForBase * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.75*Math.PI) - userRadius},
      ],
      '2': [
        {x: roomRadius + roomRadiusForBase * Math.cos(1.25*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.25*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.75*Math.PI) - userRadius},
      ],
      '3': [
        {x: roomRadius + roomRadiusForBase * Math.cos(1.25*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.25*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.50*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.50*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.75*Math.PI) - userRadius},
      ],
      '4': [
        {x: roomRadius + roomRadiusForBase * Math.cos(1.2*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.2*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.4*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.4*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.6*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.6*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.8*Math.PI) - userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.8*Math.PI) - userRadius},
      ],
      extra: [
        {x: roomRadius + roomRadiusForBase * Math.cos(1.25*Math.PI)  - userRadius,     y: roomRadius - roomRadiusForBase * Math.sin(1.25*Math.PI)  - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.425*Math.PI) - userRadius,     y: roomRadius - roomRadiusForBase * Math.sin(1.425*Math.PI) - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.61*Math.PI)  - userRadius,     y: roomRadius - roomRadiusForBase * Math.sin(1.61*Math.PI)  - userRadius},
        {x: roomRadius + roomRadiusForBase * Math.cos(1.77*Math.PI)  - 0.8*userRadius, y: roomRadius - roomRadiusForBase * Math.sin(1.77*Math.PI)  - 0.8*userRadius},
      ]
    };
    this.slotPositions = {
      owner: {x:-0.1*this.userDiameter, y:-0.1*this.userDiameter},
      '1': [
        {x: roomRadius + roomRadius * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.75*Math.PI) - userRadius},
        ],
      '2': [
        {x: roomRadius + roomRadius * Math.cos(1.25*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.25*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.75*Math.PI) - userRadius},
      ],
      '3': [
        {x: roomRadius + roomRadius * Math.cos(1.25*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.25*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.50*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.50*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.75*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.75*Math.PI) - userRadius},
      ],
      '4': [
        {x: roomRadius + roomRadius * Math.cos(1.2*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.2*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.4*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.4*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.6*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.6*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.8*Math.PI) - userRadius, y: roomRadius - roomRadius * Math.sin(1.8*Math.PI) - userRadius},
      ],
      extra: [
        {x: roomRadius + roomRadius * Math.cos(1.25*Math.PI)  - userRadius,     y: roomRadius - roomRadius * Math.sin(1.25*Math.PI)  - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.425*Math.PI) - userRadius,     y: roomRadius - roomRadius * Math.sin(1.425*Math.PI) - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.61*Math.PI)  - userRadius,     y: roomRadius - roomRadius * Math.sin(1.61*Math.PI)  - userRadius},
        {x: roomRadius + roomRadius * Math.cos(1.77*Math.PI)  - 0.8*userRadius, y: roomRadius - roomRadius * Math.sin(1.77*Math.PI)  - 0.8*userRadius},
      ]
    };

    this.positions = {};

    // this._debug(props)
  }

  _debug(props) {
    this.allUsersBase = getPresentUsersFromState(props.store.getState(), props.store.getState().app.activeGroup, props.locationId, true);
    this.allUsers = [];
    this.userI = 0;
    setInterval(() => {
      this.allUsers = [];
      for (let i = 0; i < this.userI; i++) {
        this.allUsers.push(this.allUsersBase[i])
      }
      this.userI = (this.userI + 1) % (this.allUsersBase.length+1);
      this._getUsers();
      this.forceUpdate()
    },1500)
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      // only redraw if the amount of rooms changes.
      const state = store.getState();
      if (this.renderState === undefined)
        return;
      if (state.app.activeGroup) {
        if (state.groups[state.app.activeGroup].locations.presentUsers != this.renderState.groups[state.app.activeGroup].locations.presentUsers) {
          this._getUsers();
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUpdate(newProps) { }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // experiment
  shouldComponentUpdate(nextProps, nextState) {
    // console.log("Should component update?",nextProps, nextState)
    return false
  }


  _getUsers() {
    const store = this.props.store;
    const state = store.getState();
    let activeGroup = state.app.activeGroup;

    let presentUsers = getPresentUsersFromState(state, activeGroup, this.props.locationId);
    // presentUsers = this.allUsers; // ENABLE FOR DEBUG

    let slotCount = 0;
    let drawCount = 0;
    let totalCount = 0;
    let newPositions = {};
    let drawThreshold = 4;

    // get the amount of users other than the owner in this room
    for (let i = 0; i < presentUsers.length; i++) {
      if (presentUsers[i].id != state.user.userId) {
        if (drawCount < drawThreshold) {
          drawCount += 1;
        }
        totalCount += 1;
      }
    }

    // get the number for the extra indicator if needed. +1 is because we draw max 4 people but if more we draw 3 and the button
    let extra = totalCount > drawThreshold ? totalCount - drawThreshold + 1 : 0;

    let introAnimations = [];
    let exitAnimations = [];

    // put users in the slot structure
    for (let i = 0; i < presentUsers.length; i++) {
      let user = presentUsers[i];

      // placing the owner image
      if (user.id == state.user.userId) {
        newPositions[user.id] = this.slotPositions.owner;

        // create a reference to the user if we dont have it in this room yet.
        if (this.positions[user.id] === undefined) {
          // add animation to add user.
          this.positions[user.id] = {
            obj: undefined,
            top: new Animated.Value(this.basePositions.owner.y),
            left: new Animated.Value(this.basePositions.owner.x),
            opacity: new Animated.Value(0),
            base: this.basePositions.owner
          };

          // create RN object with the references to the animation variables.
          this.positions[user.id].obj = (
            <Animated.View key={user.id} style={{position:'absolute', top: this.positions[user.id].top, left: this.positions[user.id].left, opacity: this.positions[user.id].opacity}}>
              <ProfilePicture picture={state.groups[activeGroup].users[user.id].picture} size={1.2 * this.userDiameter} />
            </Animated.View>
          );

          // we do all animations in one call so we collect them in an array.
          introAnimations.push(Animated.timing(this.positions[user.id].top, {toValue: newPositions[user.id].y, duration: 200}));
          introAnimations.push(Animated.timing(this.positions[user.id].left, {toValue: newPositions[user.id].x, duration: 200}));
          introAnimations.push(Animated.timing(this.positions[user.id].opacity, {toValue: 1, duration: 200}));
        }
      }
      else {

        // we have handcoded the positions for all users, for 3 users we have a certain config. We put the positions in the case of 3 users in slotsegment 3
        let slotSegment = drawCount;

        // there is a special case if we need to show the "extra" circle
        if (extra > 0) {
          slotSegment = "extra";
        }

        // the last user is ignored, instead of that we draw the extra cicle
        if (i === drawThreshold && extra > 0) {
          newPositions['extra'] = this.slotPositions[slotSegment][slotCount];
        }
        else {
          newPositions[user.id] = this.slotPositions[slotSegment][slotCount];
        }


        // construct the extra circle
        if (i == drawThreshold && extra > 0) {
          if (this.positions['extra'] === undefined) {
            this.positions['extra'] = {
              obj: undefined,
              top: new Animated.Value(this.basePositions[slotSegment][slotCount].y),
              left: new Animated.Value(this.basePositions[slotSegment][slotCount].x),
              opacity: new Animated.Value(0),
              base: this.basePositions[slotSegment][slotCount]
            };
            this.positions['extra'].obj = (
              <Animated.View key={'extra'} style={{position: 'absolute', top: this.positions['extra'].top, left: this.positions['extra'].left, opacity: this.positions['extra'].opacity}}>
                <TextCircle text={"+" + extra} size={0.8 * this.userDiameter}/>
              </Animated.View>
            );
            introAnimations.push(Animated.timing(this.positions['extra'].top, {toValue: newPositions['extra'].y, duration: 200}));
            introAnimations.push(Animated.timing(this.positions['extra'].left, {toValue: newPositions['extra'].x, duration: 200}));
            introAnimations.push(Animated.timing(this.positions['extra'].opacity, {toValue: 1, duration: 200}));
          }
        }
        else {
          // construct the RN object and references for this user.
          if (this.positions[user.id] === undefined) {
            this.positions[user.id] = {
              obj: undefined,
              top: new Animated.Value(this.basePositions[slotSegment][slotCount].y),
              left: new Animated.Value(this.basePositions[slotSegment][slotCount].x),
              opacity: new Animated.Value(0),
              base: this.basePositions[slotSegment][slotCount]
            };
            this.positions[user.id].obj = (
              <Animated.View key={user.id} style={{position: 'absolute', top: this.positions[user.id].top, left: this.positions[user.id].left, opacity: this.positions[user.id].opacity}}>
                <ProfilePicture picture={state.groups[activeGroup].users[user.id].picture} size={this.userDiameter} />
              </Animated.View>
            );
            introAnimations.push(Animated.timing(this.positions[user.id].top, {toValue: newPositions[user.id].y, duration: 200}));
            introAnimations.push(Animated.timing(this.positions[user.id].left, {toValue: newPositions[user.id].x, duration: 200}));
            introAnimations.push(Animated.timing(this.positions[user.id].opacity, {toValue: 1, duration: 200}));
          }
          else {
            this.positions[user.id].base = this.basePositions[slotSegment][slotCount];
          }
        }

        slotCount += 1;
      }

      // we only draw a maximum of 4 items.
      if (slotCount == drawThreshold) {
        break
      }
    }

    // if we create new elements, we have to wait for them to draw before we animate them. 100 is an estimate.
    if (introAnimations.length > 0) {
      setTimeout(() => {
        Animated.parallel(introAnimations).start();
      }, 100);
    }

    // we loop over the existing items to see if there are some that have moved or disappeared.
    Object.keys(this.positions).forEach((userId) => {
      if (newPositions[userId] === undefined) {
        // add animation to remove user
        exitAnimations.push(Animated.timing(this.positions[userId].top, {toValue: this.positions[userId].base.y, duration: 200}));
        exitAnimations.push(Animated.timing(this.positions[userId].left, {toValue: this.positions[userId].base.x, duration: 200}));
        exitAnimations.push(Animated.timing(this.positions[userId].opacity, {toValue: 0, duration: 200}));
        setTimeout(() => {
          delete this.positions[userId];
        },200)

      }
      else if(newPositions[userId].x != this.positions[userId].x || newPositions[userId].y != this.positions[userId].y) {
        // add animation on change of position.
        exitAnimations.push(Animated.timing(this.positions[userId].left, {toValue: newPositions[userId].x, duration: 200}));
        exitAnimations.push(Animated.timing(this.positions[userId].top, {toValue: newPositions[userId].y, duration: 200}));
      }
    });

    if (exitAnimations.length > 0) {
      Animated.parallel(exitAnimations).start();
    }
  }

  getUsers() {
    let userObjects = [];
    for (let userId in this.positions) {
      if (this.positions.hasOwnProperty(userId)) {
        userObjects.push(this.positions[userId].obj)
      }
    }
    return userObjects
  }



  render() {
    const store = this.props.store;
    const state = store.getState();
    this.renderState = store.getState();

    return (
      <View style={{position:'absolute', top:0, left:0}}>
        {this.getUsers()}
      </View>
    )
  }
}
