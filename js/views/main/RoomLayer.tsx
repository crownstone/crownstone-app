import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  PanResponder,
  Platform,
  ScrollView,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

let Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler } from '../../native/setup/SetupStateHandler'
import { RoomCircle }        from '../components/RoomCircle'
import { getFloatingStones, getAmountOfStonesInLocation } from '../../util/DataUtil'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight, availableScreenHeight} from '../styles'
import { LOG }               from '../../logging/Log'
import PhysicsEngine from '../../logic/PhysicsEngine';
import { UserLayer } from './UserLayer';
import { AnimatedDoubleTap } from "../components/animated/AnimatedDoubleTap";
import { Scheduler } from "../../logic/Scheduler";

export class RoomLayer extends Component<any, any> {
  _panResponder: any = {};
  _multiTouch = false;
  _currentSphere = null;
  _multiTouchUsed = false;
  _initialDistance : number;
  _currentScale : number;
  _minScale : number = 0.1;
  _maxScale : number = 1.25;
  _baseRadius : number;
  _pressedLocationData : any = false;
  _recenteringInProgress = false;

  _validTap = false;
  _lastTapLocation = false;
  _lastTap = 0;
  _totalMovedX = 0;
  _totalMovedY = 0;
  _panOffset : any = {x:0, y:0};
  _currentPan : any = {x:0, y:0};

  physicsEngine : any;
  panListener : any;

  animationFrame : any;

  nodes: any;
  unsubscribeStoreEvents: any;
  unsubscribeSetupEvents: any[];
  unsubscribeGestureEvents: any[];

  wiggleInterval : any;

  viewWidth : number = screenWidth;
  viewHeight : number = availableScreenHeight;

  boundingBoxData : any = {};
  _shownDoubleTap = false;
  _clearScheduledDoubleTapGesture = () => {};

  constructor(props) {
    super();

    this._baseRadius = 0.15 * screenWidth;
    let initialScale = 1;
    this._currentScale = initialScale;
    this.state = {
      iconOpacity: new Animated.Value(0),
      scale: new Animated.Value(initialScale),
      opacity: new Animated.Value(1),
      pan: new Animated.ValueXY(),
      locations: {}
    };

    this.physicsEngine = new PhysicsEngine();
    this._currentSphere = props.sphereId;

    if (Platform.OS === 'android') {
      this.viewWidth =  3 * screenWidth;
      this.viewHeight = 3 * availableScreenHeight;
    }
  }

  _findPress(x,y) {
    let cx = 0.5*screenWidth;
    let cy = 0.5*availableScreenHeight;

    let offsetX = (this.viewWidth - screenWidth)*0.5;
    let offsetY = (this.viewHeight - availableScreenHeight)*0.5;

    let x2 = x - this._currentPan.x;
    let y2 = y - this._currentPan.y;

    let dx2 = x2 - cx;
    let dy2 = y2 - cy;

    let dx1 = dx2 / this._currentScale;
    let dy1 = dy2 / this._currentScale;

    let x1 = cx + dx1 + offsetX;
    let y1 = cy + dy1 + offsetY;

    let nodeIds = Object.keys(this.nodes);
    let diameter = 2*this._baseRadius;
    let found = false;
    for(let i = 0; i < nodeIds.length; i++) {
      let node = this.nodes[nodeIds[i]];
      if (node.x + diameter > x1 && node.y + diameter > y1 && node.x < x1 && node.y < y1) {
        found = true;
        let nodeId = nodeIds[i] === 'null' ? null : nodeIds[i];
        if (this._pressedLocationData !== nodeIds[i]) {
          this.state.locations[nodeId].scale.stopAnimation();
          this.state.locations[nodeId].opacity.stopAnimation();
          this._pressedLocationData = nodeId;

          let tapAnimations = [];
          tapAnimations.push(Animated.spring(this.state.locations[nodeIds[i]].scale, { toValue: 1.25, friction: 4, tension: 70 }));
          tapAnimations.push(Animated.timing(this.state.locations[this._pressedLocationData].opacity, {toValue: 0.2, duration: 100}));
          Animated.parallel(tapAnimations).start();
        }

        return {nodeId: nodeId, dx: (x1 - node.x), dy: (node.y - y1)};
      }
    }

    return false;
  }

  componentWillUpdate(nextProps, nextState) {
    // go to a new sphere
    if (nextProps.sphereId !== this._currentSphere) {
      this._currentSphere = nextProps.sphereId;
      this._panOffset.x = 0;
      this._panOffset.y = 0;
      this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y });
      this.state.pan.setValue({ x: 0, y: 0 });
      this._currentPan = {x:0, y:0};
      this._currentScale = 1;

      this.loadInSolver();
    }
  }

  componentWillMount() {
    this.panListener = this.state.pan.addListener(value => this._currentPan = value);
    this.loadInSolver();

    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.state.pan.stopAnimation();
        // gestureState.d{x,y} will be set to zero now
        this._multiTouchUsed = false;
        this._totalMovedX = 0;
        this._totalMovedY = 0;
        this._pressedLocationData = this._findPress(gestureState.x0, gestureState.y0 - topBarHeight);
        this._validTap = true;
        this._clearScheduledDoubleTapGesture()
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        if (gestureState.numberActiveTouches === 1) {
          this._totalMovedX += Math.abs(gestureState.dx);
          this._totalMovedY += Math.abs(gestureState.dy);
          this._multiTouch = false;

          if (this._totalMovedX < 50 && this._totalMovedY < 50 && this._multiTouchUsed === false) {
            this._pressedLocationData = this._findPress(gestureState.x0, gestureState.y0 - topBarHeight);
            if (this._pressedLocationData !== false) {
              // do nothing
            }
            else {
              return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }])(evt, gestureState);
            }
          }
          else {
            this._clearTap();
            return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }])(evt, gestureState);
          }
        }
        else {
          this._clearTap();
          this._multiTouchUsed = true;
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
        let showRecenterGesture = () => {
          if (Math.abs(this._panOffset.x) > 0.9*this.boundingBoxData.effectiveWidth || Math.abs(this._panOffset.y) > 0.9*this.boundingBoxData.effectiveHeight) {
            this._clearScheduledDoubleTapGesture();
            this._clearScheduledDoubleTapGesture = Scheduler.scheduleCallback(() => {
              if (this._shownDoubleTap === false) {
                this.props.eventBus.emit("showDoubleTapGesture");
                this._shownDoubleTap = true;
              }
              this._recenter();
              this._clearScheduledDoubleTapGesture = () => {};
            }, 400);
          }
        };

        if (gestureState.vx !== 0 || gestureState.vy !== 0) {
          Animated.decay(this.state.pan, { velocity: {x: gestureState.vx, y: gestureState.vy}, deceleration:0.99}).start(() => {
            this._panOffset.x = this._currentPan.x;
            this._panOffset.y = this._currentPan.y;
            this.state.pan.setOffset({x: this._currentPan.x, y: this._currentPan.y });
            this.state.pan.setValue({ x: 0, y: 0 });
            showRecenterGesture()
          });
        }
        else {
          this._panOffset.x += gestureState.dx;
          this._panOffset.y += gestureState.dy;
          this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y });
          this.state.pan.setValue({ x: 0, y: 0 });

          if (this._validTap === false) {
            showRecenterGesture();
          }
        }

        this._multiTouch = false;

        if (this._validTap === true) {
          if (this._lastTapLocation === this._pressedLocationData.nodeId && new Date().valueOf() - this._lastTap < 300) {
            this._recenter();
          }
          else {
            showRecenterGesture();
          }

          this._lastTapLocation = this._pressedLocationData.nodeId;
          this._lastTap = new Date().valueOf();
        }

        if (this._pressedLocationData !== false) {
          this.state.locations[this._pressedLocationData.nodeId].scale.stopAnimation();
          this.state.locations[this._pressedLocationData.nodeId].opacity.stopAnimation();
          this.props.eventBus.emit('roomCircleTap'+this._pressedLocationData.nodeId, this._pressedLocationData);
        }

        if (this._currentScale > this._maxScale) {
          Animated.spring(this.state.scale, { toValue: this._maxScale, friction: 7, tension: 70 }).start(() => { this._currentScale = this._maxScale; });
        }
        else if (this._currentScale < this._minScale) {
          Animated.spring(this.state.scale, { toValue: this._minScale, friction: 7, tension: 70 }).start(() => { this._currentScale = this._minScale; });
        }

        this._clearTap();
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

  componentDidMount() {
    // to ensure
    let reloadSolverOnDemand = () => {
      // only reload the nodes in the solver if we need to add one.
      let floatingRoomRequired = this._isFloatingRoomRequired(this.props.store.getState());
      if (floatingRoomRequired === false && this.state.locations['null'] !== undefined) {
        this.loadInSolver();
      }
      else if (floatingRoomRequired && this.state.locations['null'] === undefined) {
        this.loadInSolver();
      }
    };

    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupStarting',  reloadSolverOnDemand));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupCleanedUp', reloadSolverOnDemand));

    this.unsubscribeSetupEvents.push(this.props.eventBus.on('setupStonesDetected',  () => {
      reloadSolverOnDemand();
      this.setWiggleInterval();
    }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on('noSetupStonesVisible', () => {
      this.clearWiggleInterval();
      reloadSolverOnDemand();
    }));

    this.unsubscribeStoreEvents = this.props.eventBus.on('databaseChange', (data) => {
      let change = data.change;

      if (change.changeLocations) {
        this.loadInSolver();
      }

      if (
        change.changeStones ||      // in case a stone that was floating was removed (and it was the last one floating) or added (and its floating)
        change.stoneLocationUpdated // in case a stone was moved from floating to room and it was the last one floating.)
        ) {
        reloadSolverOnDemand();
      }
    });

    this.unsubscribeGestureEvents = [];
    this.unsubscribeGestureEvents.push(this.props.eventBus.on('showDoubleTapGesture', () => {
      Scheduler.scheduleCallback(() => { this._shownDoubleTap = false;}, 5000)
    }))
  }

  setWiggleInterval() {
    this.wiggleInterval = setInterval(() => {
      if (this._pressedLocationData !== null && this.state.locations['null'] !== undefined) {
        Animated.spring(this.state.locations['null'].scale, { toValue: 0.9 + Math.random() * 0.35, friction: 1, tension: 60 }).start();
      }
    }, 1000);
  }

  clearWiggleInterval() {
    clearInterval(this.wiggleInterval);
  }

  componentWillUnmount() {
    this.clearWiggleInterval();
    this.unsubscribeGestureEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
    this.state.pan.removeListener(this.panListener);
    this.physicsEngine.clear();
  }

  _getBoundingBox() {
    // get bounding box
    let minX = 1e10;
    let maxX = -1e10;
    let minY = 1e10;
    let maxY = -1e10;
    let nodeIds = Object.keys(this.nodes);

    if (nodeIds.length === 0) {
      return;
    }

    for(let i = 0; i < nodeIds.length; i++) {
      let node = this.nodes[nodeIds[i]];
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
    // correct bounding box
    maxX += 2*this._baseRadius;
    maxY += 2*this._baseRadius;

    // add padding
    minX -= 0.3*this._baseRadius;

    // draw it as nice as possible depending on whether or not the multiple sphere button is drawn.
    if (this.props.multipleSpheres) {
      minY -= 0.7*this._baseRadius;
    }
    else {
      minY -= 0.3*this._baseRadius;
    }
    maxX += 0.3*this._baseRadius;
    maxY += 0.7*this._baseRadius;

    this.boundingBoxData['minX'] = minX;
    this.boundingBoxData['maxX'] = maxX;
    this.boundingBoxData['minY'] = minY;
    this.boundingBoxData['maxY'] = maxY;
    this.boundingBoxData['width'] = this.boundingBoxData.maxX - this.boundingBoxData.minX;
    this.boundingBoxData['height'] = this.boundingBoxData.maxY - this.boundingBoxData.minY;

    // set scale
    this.boundingBoxData['requiredScale'] = Math.min(this._maxScale, Math.max(this._minScale, Math.min(screenWidth/this.boundingBoxData.width, availableScreenHeight/this.boundingBoxData.height)));

    this.boundingBoxData['effectiveWidth']  = this.boundingBoxData.width  * this.boundingBoxData.requiredScale;
    this.boundingBoxData['effectiveHeight'] = this.boundingBoxData.height * this.boundingBoxData.requiredScale;

    // center of bounding box projected on world coordinates
    this.boundingBoxData['massCenter'] = {x: this.boundingBoxData.minX + 0.5*this.boundingBoxData.width, y: this.boundingBoxData.minY + 0.5*this.boundingBoxData.height};

    // actual center of the view.
    this.boundingBoxData['viewCenter'] = {x: 0.5*this.viewWidth, y: 0.5*this.viewHeight+10};

  }

  _recenter(fadeIn = false) {
    if (!this._recenteringInProgress) {
      this._recenteringInProgress = true;
    }

    if (this.boundingBoxData.minX === undefined) {
      this._getBoundingBox();
    }

    // determine offset to center everything.
    let offsetRequired = {
      x: this.boundingBoxData['requiredScale']*(this.boundingBoxData['viewCenter'].x - this.boundingBoxData['massCenter'].x) - this._panOffset.x,
      y: this.boundingBoxData['requiredScale']*(this.boundingBoxData['viewCenter'].y - this.boundingBoxData['massCenter'].y) - this._panOffset.y
    };

    // batch animations together.
    let animations = [];
    if (fadeIn) {
      animations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 600}));
    }
    else {
      // fallback in case the transparency is not perfectly set due to animation race conditions.
      animations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 0}));
    }

    animations.push(Animated.timing(this.state.scale, { toValue: this.boundingBoxData.requiredScale, duration:600}));
    animations.push(Animated.timing(this.state.pan, { toValue: {x: offsetRequired.x, y: offsetRequired.y}, duration:600}));
    Animated.parallel(animations).start(() => {
      this._panOffset.x += offsetRequired.x;
      this._panOffset.y += offsetRequired.y;
      this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y });
      this.state.pan.setValue({ x: 0, y: 0 });
      this._currentPan = {x:0, y:0};
      this._currentScale = this.boundingBoxData.requiredScale;
      this._recenteringInProgress = false;
    });
  }

  _clearTap() {
    if (this._pressedLocationData !== false) {
      this.state.locations[this._pressedLocationData.nodeId].scale.stopAnimation();
      this.state.locations[this._pressedLocationData.nodeId].opacity.stopAnimation();
      let revertAnimations = [];
      revertAnimations.push(Animated.timing(this.state.locations[this._pressedLocationData.nodeId].scale, {toValue: 1, duration: 100}));
      revertAnimations.push(Animated.timing(this.state.locations[this._pressedLocationData.nodeId].opacity, {toValue: 1, duration: 100}));
      Animated.parallel(revertAnimations).start();
    }

    this._validTap = false;
    this._pressedLocationData = false;
  }

  loadInSolver() {
    this.state.opacity.setValue(0);
    this.physicsEngine.clear();
    const store = this.props.store;
    const state = store.getState();
    let floatingStones = getFloatingStones(state, this._currentSphere);
    let showFloatingCrownstones = floatingStones.length > 0 || SetupStateHandler.areSetupStonesAvailable() === true;

    let roomIds = Object.keys(state.spheres[this._currentSphere].locations);
    let center = {x: 0.5*this.viewWidth - this._baseRadius, y: 0.5*this.viewHeight - this._baseRadius};

    this.state.locations = {};
    this.nodes = {};
    let edges = {};

    // load rooms into nodes
    for (let i = 0; i < roomIds.length; i++) {
      let id = roomIds[i];
      this.nodes[id] = {id: id, mass: 1, fixed: false, support:false};
      this.state.locations[id] = {x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1), opacity: new Animated.Value(1)};
    }

    if (showFloatingCrownstones) {
      let id = null;
      this.nodes[id] = {id: id, mass: 1, fixed: false, support:false};
      this.state.locations[id] = {x: new Animated.Value(0), y: new Animated.Value(0), scale: new Animated.Value(1), opacity: new Animated.Value(1)};
    }


    let nodeIds = Object.keys(this.nodes);
    let initialized = false;
    cancelAnimationFrame(this.animationFrame);

    let onStable = (data) => {
      this.animationFrame = requestAnimationFrame(() => {
        let node = null;
        for (let i = 0; i < nodeIds.length; i++) {
          node = this.nodes[nodeIds[i]];
          if (node.support !== true) {
            this.state.locations[nodeIds[i]].x.setValue(this.nodes[nodeIds[i]].x);
            this.state.locations[nodeIds[i]].y.setValue(this.nodes[nodeIds[i]].y);
          }
        }

        // calculate all bounding box properties once.
        this._getBoundingBox();

        if (initialized === false) {
          this._recenter(true);
          initialized = true;
        }
      })
    };

    // here we do not use this.viewWidth because it is meant to give the exact screen proportions
    this.physicsEngine.initEngine(center, screenWidth, availableScreenHeight - 50, this._baseRadius, () => {}, onStable);
    this.physicsEngine.load(this.nodes, edges);
    this.physicsEngine.stabilize(300, false);
  }


  _renderRoom(locationId) {
    // variables to pass to the room overview
    return (
      <RoomCircle
        eventBus={this.props.eventBus}
        locationId={locationId}
        sphereId={this.props.sphereId}
        opacity={this.state.locations[locationId].opacity}
        radius={this._baseRadius}
        store={this.props.store}
        scale={this.state.locations[locationId].scale}
        pos={{x: this.state.locations[locationId].x, y: this.state.locations[locationId].y}}
        seeStonesInSetupMode={SetupStateHandler.areSetupStonesAvailable()}
        viewingRemotely={this.props.viewingRemotely}
        key={locationId || 'floating'}
      />
    );
  }

  _isFloatingRoomRequired(state) {
    let floatingStones = getFloatingStones(state, this.props.sphereId);
    return floatingStones.length > 0 || SetupStateHandler.areSetupStonesAvailable() === true;
  }

  getRooms(state) {
    let rooms = state.spheres[this.props.sphereId].locations;

    let showFloatingCrownstones = this._isFloatingRoomRequired(state);

    let roomNodes = [];
    let roomIdArray = Object.keys(rooms).sort();
    if (showFloatingCrownstones) {
      roomIdArray.push(null);
    }

    // check if the roomId. Race conditions may trigger this.
    // The null roomId: THIS SHOULD BE COVERED BY THE setupStarting and setupCleanedUp events. This is here as a fallback.
    // If there is a need for an floatingCrownstone location node and there is none in the solver, reload solver.
    // If the room is there but there is no need for it, reload solver.
    for (let i = 0; i < roomIdArray.length; i++) {
      if (this.state.locations[roomIdArray[i]] === undefined) {
        LOG.error('RoomLayer: Reloading solver due to roomId that is not in state.', roomIdArray[i] );
        this.loadInSolver();
        break;
      }
    }

    // gather the room nodes to render.
    for (let i = 0; i < roomIdArray.length; i++) {
      roomNodes.push(this._renderRoom(roomIdArray[i]));
    }

    return roomNodes;
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

      const store = this.props.store;
      const state = store.getState();

      return (
        <View {...this._panResponder.panHandlers} style={{backgroundColor: 'transparent', position: 'absolute', top: 0, left: 0, width: screenWidth, height: availableScreenHeight, overflow:'hidden'}}>
          <Animated.View style={
            [animatedStyle,
              {
                width:    this.viewWidth,
                height:   this.viewHeight,
                opacity:  this.state.opacity,
                position: 'relative',
                top:  -(this.viewHeight - availableScreenHeight)*0.5,
                left: -(this.viewWidth  - screenWidth)*0.5,
              }
            ]}>
            { this.getRooms(state) }
            <UserLayer
              width={this.viewWidth}
              height={this.viewHeight}
              store={this.props.store}
              eventBus={this.props.eventBus}
              sphereId={this.props.sphereId}
              nodes={this.nodes}
              nodeRadius={this._baseRadius}
            />
          </Animated.View>
          <AnimatedDoubleTap width={screenWidth} height={availableScreenHeight} eventBus={this.props.eventBus} />
        </View>
      );
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