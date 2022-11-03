
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ForceDirectedView", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  View
} from 'react-native';

import {
  Svg,
  LinearGradient,
  Line,
  Path,
  Stop,
  Text,
  } from 'react-native-svg';


import { colors, screenWidth, availableScreenHeight} from "../../styles";
import PhysicsEngine from "../../../logic/PhysicsEngine";
import {Scheduler} from "../../../logic/Scheduler";
import {eventBus} from "../../../util/EventBus";
import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";

export class ForceDirectedView extends Component<{
  nodeIds: string[],
  viewId: string,
  height: number,
  heightOffset?: number,
  edges?: any,
  positionGetter?: any
  nodeRadius: number,
  renderNode(string, any): any,
  edgeRenderSettings?(edge): any,
  topOffset?: number,
  bottomOffset?: number,
  allowDrag?: boolean,
  drawToken?: string,
  initialPositions?: any,
  enablePhysics?: boolean,
  options? : any,
  zoomOutCallback? : any,
  zoomInCallback? : any,
  testID? : string,
}, any> {

  state:any; // used to avoid warnings for setting state values

  _panResponder: any = {};
  _multiTouch = false;
  _drawToken = null;
  _multiTouchUsed = false;
  _initialDistance : number;
  _currentScale : number;
  _minScale : number = 0.1;
  _maxScale : number = 1.25;
  _draggingNode : any = false;
  _pressedNodeData : any = false;
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
  recenterOnStable = false;

  nodes: any = {};
  edges: any = [];
  edgeMap: any = {};
  unsubscribeGestureEvents: any[];

  viewWidth : number = screenWidth;
  viewHeight : number = availableScreenHeight;
  frameHeight : number = availableScreenHeight;

  boundingBoxData : any = {};
  _clearRecenterAction = () => {};

  _dragInitialX = 0;
  _dragInitialY = 0;

  _viewRef: any;

  constructor(props) {
    super(props);

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
    this._drawToken = props.drawToken;

    this.frameHeight = this.props.height || availableScreenHeight;
    if (Platform.OS === 'android') {
      this.viewWidth =  8 * screenWidth;
      this.viewHeight = 8 * this.frameHeight;
    }

    this.init();
  }

  nodeTouch(nodeId: string) {
    this._pressedNodeData = {nodeId};
  }

  shouldComponentUpdate(nextProps, nextState) {
    // update the offset if it was changed
    if(nextProps.height !== this.frameHeight) {
      this.frameHeight = nextProps.height || availableScreenHeight;
    }

    if (nextProps.drawToken !== this._drawToken) {
      this._drawToken = nextProps.drawToken;
      this._panOffset.x = 0;
      this._panOffset.y = 0;
      this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y });
      this.state.pan.setValue({ x: 0, y: 0 });
      this._currentPan = {x:0, y:0};
      this._currentScale = 1;

      this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
    }
    else if (this.props.nodeIds.length !== nextProps.nodeIds.length) {
      this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
    }
    else if (this.props.nodeIds.join() !== nextProps.nodeIds.join()) {
      this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
    }
    else if (this.props.nodeIds.indexOf(null) !== nextProps.nodeIds.indexOf(null)) {
      this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
    }
    else if (nextProps.initialPositions && nextProps.initialPositions && xUtil.deepCompare(nextProps.initialPositions, this.props.initialPositions) === false) {
      this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
    }
    else {
      // check for changes in edges.
      let edgeIdsCurrent = [];
      let edgeIdsNew = [];
      if (nextProps.edges && Array.isArray(nextProps.edges)) {
        for (let i = 0; i < nextProps.edges.length; i++) {
          edgeIdsCurrent.push(nextProps.edges[i].id);
        }
        edgeIdsCurrent.sort();
      }
      if (this.props.edges && Array.isArray(this.props.edges)) {
        for (let i = 0; i < this.props.edges.length; i++) {
          edgeIdsNew.push(this.props.edges[i].id);
        }
        edgeIdsNew.sort();
      }
      if (edgeIdsCurrent.join() !== edgeIdsNew.join()) {
        // the ids are different --> we need to change the physics
        this.loadIdsInSolver(nextProps.nodeIds, nextProps.nodeRadius, nextProps.edges, nextProps.initialPositions, nextProps.enablePhysics);
      }
      else {
        // the IDs are not different, but we will merge the edge information into our edges anyway.
        if (nextProps.edges && Array.isArray(nextProps.edges)) {
          for (let i = 0; i < nextProps.edges.length; i++) {
            let edgeId = nextProps.edges[i].id;
            this.edges[this.edgeMap[edgeId]] = xUtil.deepExtend(this.edges[this.edgeMap[edgeId]], nextProps.edges[i])
          }
        }
      }
    }
    return true;
  }

  initLayout() {
    this.loadIdsInSolver(this.props.nodeIds, this.props.nodeRadius, this.props.edges, this.props.initialPositions, this.props.enablePhysics);
  }

  init() {
    this.panListener = this.state.pan.addListener(value => this._currentPan = value);
    this.initLayout();

    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder:        (evt, gestureState) => { return true; },
      onStartShouldSetPanResponderCapture: (evt, gestureState) => { return false; },
      onMoveShouldSetPanResponder:         (evt, gestureState) => { return true; },
      onMoveShouldSetPanResponderCapture:  (evt, gestureState) => { return true; },
      onPanResponderTerminationRequest:    (evt, gestureState) => { return true; },
      onPanResponderGrant:                 (evt, gestureState) => {
        // console.log("onPanResponderGrant", )
        core.eventBus.emit("viewWasTouched" + this.props.viewId)
        this.state.pan.stopAnimation();
        // gestureState.d{x,y} will be set to zero now
        this._multiTouchUsed = false;
        this._totalMovedX = 0;
        this._totalMovedY = 0;

        this._validTap = true;
        this._clearRecenterAction()
        return false
      },
      onPanResponderMove: (evt, gestureState) => {
        // The most recent move distance is gestureState.move{X,Y}
        let threshold = 0;
        if (Platform.OS === 'android') {
          threshold = 5;
        }
        console.log("onPanResponderMove", gestureState.dx, gestureState.dy, Math.abs(gestureState.dx) > threshold, Math.abs(gestureState.dy) > threshold, this._pressedNodeData)
        if (
          (Math.abs(gestureState.dx) < 50        && Math.abs(gestureState.dy) < 50) &&               // We do not want to send too many events, only in the beginning of the move
          (Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold) && // threshold is needed for android, onPanResponderMove is more sensitive on Android
          this._multiTouchUsed === false) {
          console.log("EMITTING EVENT")
          core.eventBus.emit('userDragEvent' + this.props.viewId);
        }

        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
        if (gestureState.numberActiveTouches === 1) {
          this._totalMovedX += Math.abs(gestureState.dx);
          this._totalMovedY += Math.abs(gestureState.dy);
          this._multiTouch = false;

          if (this._draggingNode !== false && this.props.allowDrag) {
            let nodeId = this._draggingNode.nodeId;
            let newX = this._dragInitialX + gestureState.dx / this._currentScale;
            let newY = this._dragInitialY + gestureState.dy / this._currentScale;
            this.state.nodes[nodeId].x.setValue(snapToGrid(newX));
            this.state.nodes[nodeId].y.setValue(snapToGrid(newY));
            this.nodes[nodeId].x = newX;
            this.nodes[nodeId].y = newY;
          }
          else if (this._totalMovedX < 50 && this._totalMovedY < 50 && this._multiTouchUsed === false) {
            if (this._pressedNodeData !== false) {
              // do nothing
              if (this.props.allowDrag) {
                this._draggingNode = this._pressedNodeData;
                this._dragInitialX = this.nodes[this._pressedNodeData.nodeId].x;
                this._dragInitialY = this.nodes[this._pressedNodeData.nodeId].y;
              }
            }
            else {
              return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }], {useNativeDriver: false})(evt, gestureState);
            }
          }
          else {
            this._clearTap();
            return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }], {useNativeDriver: false})(evt, gestureState);
          }
        }
        else {
          this._clearTap();
          this._multiTouchUsed = true;
          let distance = getDistance(evt.nativeEvent.touches);
          core.eventBus.emit('viewWasMultitapped' + this.props.viewId);
          if (this._multiTouch === false) {
            this._initialDistance = distance;
            this._multiTouch = true;
          }
          else {
            this._currentScale = this._currentScale * (distance/this._initialDistance);
            this._initialDistance = distance;

            this.state.scale.setValue(this._currentScale);
            return Animated.event([null, { dx: this.state.pan.x, dy: this.state.pan.y }], {useNativeDriver: false})(evt, gestureState);
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        console.log("onPanResponderRelease")
        let recenterAnimation = () => {
          if (Math.abs(this._panOffset.x) > 0.9*this.boundingBoxData.effectiveWidth || Math.abs(this._panOffset.y) > 0.9*this.boundingBoxData.effectiveHeight) {
            this._clearRecenterAction();
            this._clearRecenterAction = Scheduler.scheduleCallback(() => {
              this._recenter();
              this._clearRecenterAction = () => {};
            }, 400);
          }
        };

        if (this._draggingNode === false) {
          if (gestureState.vx !== 0 || gestureState.vy !== 0) {
            Animated.decay(this.state.pan, {
              velocity: {x: gestureState.vx, y: gestureState.vy},
              deceleration: 0.99, useNativeDriver: false
            }).start(() => {
              this._panOffset.x = this._currentPan.x;
              this._panOffset.y = this._currentPan.y;
              this.state.pan.setOffset({x: this._currentPan.x, y: this._currentPan.y});
              this.state.pan.setValue({x: 0, y: 0});
              recenterAnimation()
            });
          }
          else {
            this._panOffset.x += gestureState.dx;
            this._panOffset.y += gestureState.dy;
            this.state.pan.setOffset({x: this._panOffset.x, y: this._panOffset.y});
            this.state.pan.setValue({x: 0, y: 0});

            if (this._validTap === false) {
              recenterAnimation();
            }
          }
        }


        if (this._validTap === true) {
          if  (
            (
              this._pressedNodeData === this._lastTapLocation ||
              this._pressedNodeData && (this._lastTapLocation === this._pressedNodeData.nodeId)
            ) &&
            Date.now() - this._lastTap < 300
          ) {
            this._recenter();
          }
          else {
            recenterAnimation();
          }

          this._lastTapLocation = this._pressedNodeData && this._pressedNodeData.nodeId || false;
          this._lastTap = Date.now();
        }

        this.state.opacity.setValue(1);

        if (this._pressedNodeData === false) {
          core.eventBus.emit('viewWasTapped'+this.props.viewId, this._pressedNodeData);
        }

        if (this._draggingNode !== false) {
          // calculate all bounding box properties once after drag.
          this._getBoundingBox();
        }


        if (!this._draggingNode && !this._validTap) {
          if (this._currentScale > 1.5) {
            if (this.props.zoomInCallback) {
              this.props.zoomInCallback();
            }
          }
          else if (this.boundingBoxData.width * this._currentScale < 0.4 * screenWidth) {
            if (this.props.zoomOutCallback) {
              this.props.zoomOutCallback();
            }
          }
        }

        if (this._currentScale > this._maxScale) {
          Animated.spring(this.state.scale, { toValue: this._maxScale, friction: 7, tension: 70, useNativeDriver: false }).start(() => { this._currentScale = this._maxScale; });
        }
        else if (this._currentScale < this._minScale) {
          Animated.spring(this.state.scale, { toValue: this._minScale, friction: 7, tension: 70, useNativeDriver: false }).start(() => { this._currentScale = this._minScale; });
        }

        // reset touch state variables
        this._multiTouch      = false;
        this._pressedNodeData = false;
        this._draggingNode    = false;
        core.eventBus.emit('viewReleased'+this.props.viewId);
        this._clearTap();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        console.log("onPanResponderTerminate")
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      // onShouldBlockNativeResponder: (evt, gestureState) => {
      //   // Returns whether this component should block native components from becoming the JS
      //   // responder. Returns true by default. Is currently only supported on android.
      //   return true;
      // },
    });
  }

  componentDidMount() {
    this.unsubscribeGestureEvents = [];
    this.unsubscribeGestureEvents.push(core.eventBus.on('physicsRun'+this.props.viewId, (iterations) => {
      this.recenterOnStable = true;
      this.physicsEngine.unfixNodes()
      this.physicsEngine.stabilize(iterations, false);
    }));
  }

  componentWillUnmount() {
    this.unsubscribeGestureEvents.forEach((unsubscribe) => { unsubscribe(); });
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
    maxX += 2*this.props.nodeRadius;
    maxY += 2*this.props.nodeRadius;

    // add padding
    minX -= 0.3*this.props.nodeRadius;

    // draw it as nice as possible depending on whether or not the multiple sphere button is drawn.
    minY -= 0.3*this.props.nodeRadius;
    if (this.props.topOffset) {
      minY -= this.props.topOffset;
    }

    maxX += 0.3*this.props.nodeRadius;
    maxY += 0.7*this.props.nodeRadius;

    if (this.props.bottomOffset) {
      maxY += this.props.bottomOffset;
    }

    this.boundingBoxData['minX'] = minX;
    this.boundingBoxData['maxX'] = maxX;
    this.boundingBoxData['minY'] = minY;
    this.boundingBoxData['maxY'] = maxY;
    this.boundingBoxData['width'] = this.boundingBoxData.maxX - this.boundingBoxData.minX;
    this.boundingBoxData['height'] = this.boundingBoxData.maxY - this.boundingBoxData.minY;

    // set scale
    this.boundingBoxData['requiredScale'] = Math.min(this._maxScale, Math.max(this._minScale, Math.min(screenWidth / this.boundingBoxData.width, this.frameHeight / this.boundingBoxData.height)));

    this.boundingBoxData['effectiveWidth']  = this.boundingBoxData.width  * this.boundingBoxData.requiredScale;
    this.boundingBoxData['effectiveHeight'] = this.boundingBoxData.height * this.boundingBoxData.requiredScale;

    // center of bounding box projected on world coordinates
    this.boundingBoxData['massCenter'] = {x: this.boundingBoxData.minX + 0.5*this.boundingBoxData.width, y: this.boundingBoxData.minY + 0.5*this.boundingBoxData.height};

    // actual center of the view.
    this.boundingBoxData['viewCenter'] = {x: 0.5*this.viewWidth, y: 0.5*this.viewHeight+10};

  }

  _recenter(fadeIn = false) {
    if (!this.boundingBoxData || this.boundingBoxData.minX === undefined) { return }

    if (this._recenteringInProgress === true) { return; }

    this._recenteringInProgress = true;

    // determine offset to center everything.
    let offsetRequired = {
      x: this.boundingBoxData['requiredScale']*(this.boundingBoxData['viewCenter'].x - this.boundingBoxData['massCenter'].x) - this._panOffset.x,
      y: this.boundingBoxData['requiredScale']*(this.boundingBoxData['viewCenter'].y - this.boundingBoxData['massCenter'].y) - this._panOffset.y
    };

    // batch animations together.
    let animations = [];
    if (fadeIn) {
      animations.push(Animated.timing(this.state.opacity, {toValue: 1, useNativeDriver: false, duration: 600}));
    }
    else {
      // fallback in case the transparency is not perfectly set due to animation race conditions.
      animations.push(Animated.timing(this.state.opacity, {toValue: 1, useNativeDriver: false, duration: 0}));
    }

    animations.push(Animated.timing(this.state.scale, { toValue: this.boundingBoxData.requiredScale, useNativeDriver: false, duration:600}));
    animations.push(Animated.timing(this.state.pan, { toValue: {x: offsetRequired.x, y: offsetRequired.y}, useNativeDriver: false, duration:600}));
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
    this._validTap = false;
    this._pressedNodeData = false;
  }

  loadIdsInSolver(nodeIds, radius, edges, initialPositions, enablePhysics) {
    this.state.opacity.setValue(0);
    this.physicsEngine.clear();

    let center = {x: 0.5*this.viewWidth - radius, y: 0.5*this.viewHeight - radius};

    this.state.nodes = {};
    this.nodes = {};

    // load rooms into nodes
    for (let id of nodeIds) {
      let initialPosition = initialPositions && initialPositions[id] || {x:null, y:null, fixed:false};
      this.nodes[id] = {id: id, mass: 1, fixed: initialPosition.fixed, support:false, x: initialPosition.x, y: initialPosition.y };
      this.state.nodes[id] = {x: new Animated.Value(initialPosition.x || 0), y: new Animated.Value(initialPosition.y || 0), scale: new Animated.Value(1), opacity: new Animated.Value(1)};
    }

    this.edges = [];
    this.edgeMap = {};
    if (edges && Array.isArray(edges)) {
      for (let i = 0; i < edges.length; i++) {
        this.edges.push(xUtil.deepExtend({}, edges[i]));
        this.edgeMap[edges[i].id] = i;
      }
    }

    let initialized = false;
    cancelAnimationFrame(this.animationFrame);

    let onStable = (data) => {
      this.animationFrame = requestAnimationFrame(() => {
        let node = null;
        for (let i = 0; i < nodeIds.length; i++) {
          node = this.nodes[nodeIds[i]];
          if (node.support !== true) {
            this.state.nodes[nodeIds[i]].x.setValue(this.nodes[nodeIds[i]].x);
            this.state.nodes[nodeIds[i]].y.setValue(this.nodes[nodeIds[i]].y);
          }
        }

        // calculate all bounding box properties once.
        this._getBoundingBox();

        if (initialized === false) {
          this._recenter(true);
          initialized = true;
        }
        else if (this.recenterOnStable === true) {
          this._recenter(false);
          this.recenterOnStable = false;
        }
      })
    };

    let onChange = (finishCallback) => {
      this.animationFrame = requestAnimationFrame(() => {
        let node = null;
        for (let i = 0; i < nodeIds.length; i++) {
          node = this.nodes[nodeIds[i]];
          if (node.support !== true) {
            this.state.nodes[nodeIds[i]].x.setValue(this.nodes[nodeIds[i]].x);
            this.state.nodes[nodeIds[i]].y.setValue(this.nodes[nodeIds[i]].y);
          }
        }
        finishCallback();
      })
    };


    let usePhysics = true;
    if (enablePhysics === false) {
      usePhysics = false;
    }

    // here we do not use this.viewWidth because it is meant to give the exact screen proportions
    this.physicsEngine.initEngine(center, screenWidth, this.frameHeight - 50, radius, onChange, onStable, usePhysics);
    this.physicsEngine.setOptions(this.props.options);
    this.physicsEngine.load(this.nodes, this.edges);
    if (usePhysics) {
      this.physicsEngine.stabilize(300, true);
    }
    else {
      this.physicsEngine.stabilize(0, true);
    }
  }


  getNodes() {
    let nodes = [];

    // gather the nodes to render.
    let rendered = {};
    for (let i = 0; i < this.props.nodeIds.length; i++) {
      let nodeId = this.props.nodeIds[i];
      rendered[nodeId] = true;
      nodes.push(
        this.props.renderNode(
          nodeId,
          this.state.nodes[nodeId]
        ));
    }

    // DEBUG: render support nodes
    // let nodeIds = Object.keys(this.nodes);
    // for (let i = 0; i < nodeIds.length; i++) {
    //   let nodeId = nodeIds[i];
    //   if (rendered[nodeId]) { continue; }
    //   nodes.push(
    //     <View key={"support_"+nodeId} style={{width:2*this.props.nodeRadius, height: 2*this.props.nodeRadius, backgroundColor: colors.csOrange.rgba(0.2), borderRadius: this.props.nodeRadius, position:'absolute', top: this.nodes[nodeId].y, left:this.nodes[nodeId].x}} />
    //   );
    // }

    return nodes;
  }

  getEdges() {
    if (!this.edges) {
      return;
    }


    let edges = [];
    // gather the edges to render.
    for (let i = 0; i < this.edges.length; i++) {
      let edge = this.edges[i];
      if (edge.connected === false) { continue; }

      let pos1 = {x: this.nodes[edge.from].x + this.props.nodeRadius, y: this.nodes[edge.from].y + this.props.nodeRadius};
      let pos2 = {x: this.nodes[edge.to].x   + this.props.nodeRadius, y: this.nodes[edge.to].y   + this.props.nodeRadius};

      let pos3 = {x: 0, y: 0};
      let useVia = false;
      if (edge._viaId && this.nodes[edge._viaId]) {
        useVia = true;
        pos3 = {
          x: this.nodes[edge._viaId].x + this.props.nodeRadius,
          y: this.nodes[edge._viaId].y + this.props.nodeRadius
        };
      }

      let renderSettings : any = {offset: 0, color: colors.white.hex, thickness: 3, coverage: 1};

      if (this.props.edgeRenderSettings) {
        renderSettings = this.props.edgeRenderSettings(edge);
        if (!renderSettings) { continue; }
      }


      let minX = Math.min(pos1.x, pos2.x);
      let maxX = Math.max(pos1.x, pos2.x);
      let minY = Math.min(pos1.y, pos2.y);
      let maxY = Math.max(pos1.y, pos2.y);
      if (useVia) {
        minX = Math.min(minX, pos3.x);
        maxX = Math.max(maxX, pos3.x);
        minY = Math.min(minY, pos3.y);
        maxY = Math.max(maxY, pos3.y);
      }

      let hasLabel = false;
      for (let i = 0; i < renderSettings.length; i++) {
        if (renderSettings[i].label) {
          hasLabel = true;
          break;
        }
      }

      let padding = hasLabel ? 40 : 5;
      let width = maxX - minX;
      let height = maxY - minY;
      let dist = Math.sqrt(width*width + height*height );

      let rx = height / dist;
      let ry = width / dist;

      // make sure we padd the svg enough for all the offsets
      for (let i = 0; i < renderSettings.length; i++) {
        let settings = renderSettings[i];
        if (settings.offset) {
          let dx = Math.abs(settings.offset) * rx;
          let dy = Math.abs(settings.offset) * ry;
          let ref = Math.max(dx, dy);
          padding = Math.max(ref * 2+20, padding);
        }
      }

      let sX = pos1.x - minX + padding; // start X
      let sY = pos1.y - minY + padding; // start Y
      let eX = pos2.x - minX + padding; // end X
      let eY = pos2.y - minY + padding; // end Y


      let renderEdgeWithSettings = () => {
        if (!Array.isArray(renderSettings)) {
          renderSettings = [renderSettings];
        }

        let result = [];
        let textResult = [];


        for (let i = 0; i < renderSettings.length; i++) {
          let settings = renderSettings[i];
          let offset = settings.offset || 0;
          let dx = offset * rx * ((pos1.x-pos2.x) < 0 ? -1 : 1);
          let dy = offset * ry * ((pos1.y-pos2.y) < 0 ? -1 : 1);

          let fillColor = "transparent";
          let color = settings.color || "#fff";
          if (settings.coverage !== undefined && settings.coverage !== 1) {
            let id = "grad_"+edge.id+"_"+i;
            result.push(
              <LinearGradient
                id={id}
                key={id}
                x1={sX} y1={sY} x2={eX} y2={eY}
              >
                <Stop offset={0.5*(1-settings.coverage) + ''} stopColor={color} stopOpacity="0.0" />
                <Stop offset="0.5" stopColor={color} stopOpacity={settings.opacity || 1.0} />
                <Stop offset={1-0.5*(1-settings.coverage) + ''} stopColor={color} stopOpacity="0.0" />
              </LinearGradient>
            );

            color = 'url(#'+id+')';
          }


          if (useVia) {
            result.push(
              <Path
                key={edge.id + "_" + i}
                d={"M" + ( sX + dx ) + " " + ( sY - dy ) +
                "Q" + (pos3.x - minX + padding + dx) + " " + (pos3.y - minY + padding - dy) + " " +
                (eX + dx) + " " + (eY - dy) }
                stroke={color}
                strokeWidth={settings.thickness || 3}
                strokeDasharray={settings.dashArray}
                fill={fillColor}
              />
            );
          }
          else {
            result.push(
              <Line
                key={edge.id + "_" + i}
                x1={ sX + dx }
                y1={ sY - dy }
                x2={ eX + dx }
                y2={ eY - dy }
                stroke={color}
                strokeWidth={settings.thickness || 3}
                strokeDasharray={settings.dashArray}
              />
            );
          }

          if (settings.label !== undefined) {
            let middleX = (sX + eX) * 0.5;
            let middleY = (sY + eY) * 0.5;
            textResult.push(
              <Text
                // key={edge.id + "_t" + i}
                fill={colors.white.hex}
                stroke={colors.menuBackground.hex}
                strokeWidth={2}
                fontSize="40"
                fontWeight="bold"
                x={middleX}
                y={middleY}
                textAnchor="middle"
              >{settings.label}</Text>
            );
          }

        }

        textResult.forEach((t) => { result.push(t); });

        return result
      };


      let edgeItem = (
        <View
          key={"edge" + edge.from +' '+ edge.to}
          style={{
            // backgroundColor: colors.red.rgba(0.4),
            position:'absolute',
            top:  minY - padding,
            left: minX - padding,
            width: width + 2*padding,
            height: height + 2*padding,
          }}
        >
          <Svg width={width  + 2*padding} height={height + 2*padding}>
            {renderEdgeWithSettings()}
          </Svg>
        </View>
      );
      edges.push(edgeItem);
    }

    return edges;
  }

  getPositions() {
    if (this.props.positionGetter && typeof this.props.positionGetter === 'function') {
      this.props.positionGetter(this.nodes)
    }
  }

  render() {
    const layout = this.state.pan.getLayout();
    let scale = this.state.scale;
    const animatedStyle = {
      transform: [
        { translateX: layout.left },
        { translateY: layout.top },
        { scale: scale },
      ]
    };

    // We inject the width, height and this.nodes in to the children
    let children = React.Children.map(this.props.children, (child : any) => {
      return React.cloneElement(child, {
        width:this.viewWidth,
        height:this.viewHeight,
        nodes:this.nodes,
      });
    });
    return (
      <View
        ref={(v) => { this._viewRef = v; }}
        {...this._panResponder.panHandlers}
        style={{
          flex:1, alignItems:'center',
          justifyContent:'center',
          // backgroundColor:colors.red.rgba(0.7)
        }}
        testID={this.props.testID}
      >
        <Animated.View
          style={
          [animatedStyle,
            {
              // backgroundColor: colors.green.rgba(10),
              width:    this.viewWidth,
              height:   this.viewHeight,
              opacity:  this.state.opacity,
            }
          ]}>
          { this.getEdges() }
          { this.getNodes() }
          { children }
        </Animated.View>
      </View>
    );
  }
}


function getDistance(touches) {
  let firstTouch = touches[0];
  let secondTouch = touches[1];

  let dx = firstTouch.pageX - secondTouch.pageX;
  let dy = firstTouch.pageY - secondTouch.pageY;
  return Math.max(10,Math.sqrt(dx*dx + dy*dy));
}


/**
 * this method will take a position {x,y} and will map it within 10 pixels
 */
export function snapToGrid(x) {
  let gridSize = (0.15*screenWidth)*0.125;
  let result = Math.round(x / gridSize) * gridSize;
  return result;
}
