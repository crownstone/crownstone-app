import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  PanResponder,
  ScrollView,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

let Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler } from '../../native/setup/SetupStateHandler'
import { RoomCircle }        from '../components/RoomCircle'
import { getFloatingStones, getAmountOfStonesInLocation } from '../../util/DataUtil'
import {styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight, availableScreenHeight} from '../styles'
import { LOG }               from '../../logging/Log'


export class RoomLayer extends Component<any, any> {
  _panResponder: any = {};
  _multiTouch = false;
  _initialDistance : number;
  _currentScale : number;
  _panOffset : any = {x:0, y:0};
  _minScale : number = 0.3;
  _maxScale : number = 1.4;

  constructor() {
    super();

    let initialScale = 1;
    this._currentScale = initialScale;
    this.state = {
      presentUsers: {},
      scale: new Animated.Value(initialScale),
      pan: new Animated.ValueXY()
    };
  }


  componentWillMount() {
    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!

        // gestureState.d{x,y} will be set to zero now
        console.log("Tap!", gestureState)
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        if (gestureState.numberActiveTouches === 1 && this._multiTouch === false) {
          this._multiTouch = false;
          return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }])(evt, gestureState);
        }
        else {
          let distance = getDistance(evt.nativeEvent.touches);
          if (this._multiTouch === false) {
            this._initialDistance = distance;
            this._multiTouch = true;
          }
          else {
            this._currentScale = this._currentScale * (distance/this._initialDistance);
            this._initialDistance = distance;
            this.state.scale.setValue(this._currentScale);
            return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }])(evt, gestureState);
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        this._multiTouch = false;
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
        console.log("END", gestureState.dx, gestureState.dy);
        this._panOffset.x += gestureState.dx;
        this._panOffset.y += gestureState.dy;
        this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y });
        this.state.pan.setValue({ x: 0, y: 0 });

        if (this._currentScale > this._maxScale) {
          Animated.spring(this.state.scale, { toValue: this._maxScale, friction: 7, tension: 70 }).start(() => { this._currentScale = this._maxScale; });
        }
        else if (this._currentScale < this._minScale) {
          Animated.spring(this.state.scale, { toValue: this._minScale, friction: 7, tension: 70 }).start(() => { this._currentScale = this._minScale; });
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });

  }

  loadInSolver() {
    const store = this.props.store;
    const state = store.getState();
    let rooms = state.spheres[this.props.sphereId].locations;

    let nodes = [];
    let edges = [];


  }

  componentDidMount() {}

  componentWillUnmount() {}

  _renderRoom(locationId, count, index, activeSphere) {

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
        radius={0.15*screenWidth}
        store={this.props.store}
        pos={{x:0+ 100*index, y:0}}
        seeStonesInSetupMode={SetupStateHandler.areSetupStonesAvailable()}
        viewingRemotely={this.props.viewingRemotely && false}
        key={locationId || 'floating'}
        actionParams={actionsParams}
      />
    );
  }

  getRooms() {
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

    if (amountOfRooms > 6) {
      let floatingStoneOffset = 0;
      if (showFloatingCrownstones) {
        roomNodes.push(this._renderRoom(null, amountOfRooms, 0, state.app.activeSphere));
        floatingStoneOffset = 1;
      }

      for (let i = 0; i < roomIdArray.length; i++) {
        roomNodes.push(this._renderRoom(roomIdArray[i], amountOfRooms, i + floatingStoneOffset, state.app.activeSphere))
      }

      return (
        <View style={{height: availableScreenHeight}}>
          {roomNodes}
        </View>
      );
    }
    else {
      for (let i = 0; i < roomIdArray.length; i++) {
        roomNodes.push(this._renderRoom(roomIdArray[i], amountOfRooms, i, state.app.activeSphere))
      }

      if (showFloatingCrownstones) {
        roomNodes.push(this._renderRoom(null, amountOfRooms, roomIdArray.length, state.app.activeSphere))
      }

      return roomNodes;
    }
  }

  render() {
    if (this.props.sphereId === null) {
      return <View style={{position: 'absolute', top: 0, left: 0, width: screenWidth, flex: 1}} />;
    }
    else {
      const layout = this.state.pan.getLayout();
      let scale = this.state.scale;
      const animatedStyle = {
        transform: [
          { translateX: layout.left },
          { translateY: layout.top },
          { scale: scale },
        ]
      };

      return (
        <View {...this._panResponder.panHandlers} style={{position: 'absolute', top: 0, left: 0, width: screenWidth, height: availableScreenHeight, overflow:"hidden"}}>
          <Animated.View style={animatedStyle}>
            {this.getRooms()}
          </Animated.View>
        </View>
      )
    }
  }
}


function getDistance(touches) {
  let firstTouch = touches[0];
  let secondTouch = touches[1];

  let dx = firstTouch.pageX - secondTouch.pageX;
  let dy = firstTouch.pageY - secondTouch.pageY;
  return Math.max(10,Math.sqrt(dx*dx + dy*dy));
}