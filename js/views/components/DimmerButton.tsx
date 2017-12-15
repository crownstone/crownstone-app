import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  PanResponder,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../styles'
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import {eventBus} from "../../util/EventBus";
import {AnimatedCircle} from "./animated/AnimatedCircle";
import {StoneUtil} from "../../util/StoneUtil";
import {BatchCommandHandler} from "../../logic/BatchCommandHandler";
import {INTENTS} from "../../native/libInterface/Constants";

export class DimmerButton extends Component<any, any> {
  _panResponder;
  _animationFrame;
  refName : string;
  startY : number = 0;

  radius;
  radiusIndicator;
  strokeWidth;
  correctedRadius;
  pathLength;
  deg2Rad;
  angleMax;
  angleMin;
  angleRange;
  lowerDragThreshold = 0.25;
  xCenter;
  yCenter;

  controlling = false;

  constructor(props) {
    super(props);

    this.radius = 0.48*props.size;
    this.radiusIndicator = 0.24*this.radius;
    this.strokeWidth = 0.16*props.size;
    this.correctedRadius = this.radius - 0.5*this.strokeWidth;
    this.pathLength = Math.PI * 2 * (this.correctedRadius);
    this.deg2Rad = Math.PI * 2 / 360;
    this.angleMax = 50;
    this.angleMin = 310;
    this.angleRange = this.angleMin - this.angleMax;
    this.xCenter = 0.5*screenWidth;
    this.yCenter = 0.55*props.size;

    this.refName = (Math.random() * 1e9).toString(36);
    this.state = {state: props.state || 0, pendingCommand: false, pendingId: ''}
  }

  componentWillMount() {
    let getStateFromGesture = (gestureState) => {
      let x = ((gestureState.x0 + gestureState.dx) - 0.5*screenWidth);
      let y = (gestureState.y0 + gestureState.dy - (this.startY+ 0.5*this.props.size));
      let angle = Math.atan2(y,x);
      let radius = x/Math.cos(angle);

      let correctedAngle = ((-angle/this.deg2Rad) + 450)% 360;
      let state = (this.angleMin - correctedAngle)/this.angleRange;

      return { state, radius };
    };

    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        if (this.startY === 0) {
          (this.refs[this.refName] as any).measure((fx, fy, width, height, px, py) => {
            this.startY = py;
          });
        }
        let data = getStateFromGesture(gestureState);
        if (
          data.state > this.state.state - 0.2 &&
          data.state < this.state.state + 0.2
        ) {
          this.controlling = true;
          eventBus.emit("UIGestureControl", false);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (this.controlling) {
          let data = getStateFromGesture(gestureState);

          if (data.radius > this.lowerDragThreshold * this.radius) {
            if (data.state < 0 && data.state > -0.1 && this.state.state !== 0) {
              this._updateStone(0);
            }
            else if (data.state > 1 && data.state < 1.1 && this.state.state !== 1) {
              this._updateStone(1);
            }
            else if (data.state >= 0 && data.state <= 1 && this.state.state !== data.state) {
              this._updateStone(data.state);

            }
          }
        }
      },

      onPanResponderRelease: (evt, gestureState) => {
        this.controlling = false;
        eventBus.emit("UIGestureControl", true)
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


  _transformSwitchState(switchState) {
    // linearize:
    let linearState = (Math.acos(-2*switchState+1) / Math.PI);

    // only PWM, not Relay
    linearState *= 0.99;

    return linearState;
  }


  _updateStone(state, keepConnectionOpenTimeout = 6000) {
    let stateToSwitch = this._transformSwitchState(state);
    let switchId = (Math.random()*1e9).toString(26);
    BatchCommandHandler.loadPriority(
      this.props.stone,
      this.props.stoneId,
      this.props.sphereId,
      {commandName:'multiSwitch', state: stateToSwitch, intent: INTENTS.manual, timeout: 0},
      {keepConnectionOpen: true, keepConnectionOpenTimeout: keepConnectionOpenTimeout},
      1
    )
      .then(() => {
      if (this.state.pendingId === switchId) {
        this.setState({pendingCommand: false});
        this.props.callback(stateToSwitch);
      }
    }).catch((err) => {
      if (this.state.pendingId === switchId) {
        this.setState({pendingCommand: false});
      }
    });
    if (this.state.pendingCommand === false) {
      BatchCommandHandler.executePriority();
    }
    this.setState({pendingCommand: true, pendingId: switchId, state: state});
  }

  componentWillUnmount() {
    cancelAnimationFrame(this._animationFrame);
  }

  render() {
    let state = this.state.state;
    let label = 'Turn On';
    let stateColor = colors.green.hex;
    if (state > 0) {
      label = 'Turn Off';
      stateColor = colors.menuBackground.hex;
    }

    let innerSize = 0.50*this.props.size;
    let angle = (this.angleMin - (this.angleMin - this.angleMax)*state)*this.deg2Rad;
    let indicatorX = this.xCenter + this.correctedRadius*Math.sin(angle);
    let indicatorY = this.yCenter + this.correctedRadius*Math.cos(angle);
    return (
      <View ref={this.refName} style={{width: screenWidth, height: this.props.size, alignItems:'center'}}>
        <Svg {...this._panResponder.panHandlers} style={{
          width: screenWidth,
          height: this.props.size,
          position:'absolute',
          top:0,left:0
        }}>
          <Circle
            r={this.correctedRadius}
            stroke={colors.white.hex}
            strokeWidth={this.strokeWidth}
            strokeOpacity={0.5}
            strokeDasharray={[0.75*this.pathLength, this.pathLength]}
            strokeDashOffset={0}
            rotation="135"
            x={this.xCenter}
            y={this.yCenter}
            strokeLinecap="round"
            fill="white"
            fillOpacity={0}
          />
          <Circle
            r={this.correctedRadius}
            stroke={colors.green.hex}
            strokeWidth={this.strokeWidth}
            strokeDasharray={[this.state.state*0.75*this.pathLength, this.pathLength]}
            strokeDashOffset={0}
            rotation="135"
            x={this.xCenter}
            y={this.yCenter}
            strokeLinecap="round"
            fill="white"
            fillOpacity={0}
          />
          <Circle
            r={this.radiusIndicator*1.25}
            x={indicatorX}
            y={indicatorY}
            fill={colors.black.hex}
            fillOpacity={0.2}
          />
          <Circle
            r={this.radiusIndicator}
            x={indicatorX}
            y={indicatorY}
            strokeLinecap="round"
            fill="white"
          />
          <Circle
            r={this.radiusIndicator*1.18}
            stroke="white"
            strokeWidth={this.radiusIndicator * 0.13}
            x={indicatorX}
            y={indicatorY}
            strokeLinecap="round"
            fill="white"
            fillOpacity={0}
          />
      </Svg>
      <TouchableOpacity style={{
        position:'absolute',
        top: this.yCenter - 0.5*innerSize,
        left:this.xCenter - 0.5*innerSize,
        width:innerSize,
        height:innerSize,
        alignItems:'center',
        justifyContent:'center'
      }}
      onPress={() => {
        let newState = (this.state.state > 0 ? 0 : 1);
        this._updateStone(newState, 2500);
        this._animate(newState);
      }} >
        <AnimatedCircle size={innerSize*1.05} color={colors.black.rgba(0.08)}>
          <AnimatedCircle size={innerSize} color={colors.white.hex}>
            <AnimatedCircle size={innerSize*0.95} color={colors.white.hex} borderWidth={innerSize*0.03} borderColor={stateColor}>
              <View style={{flex:1}} />
              {
                this.state.pendingCommand === true ?
                  <ActivityIndicator animating={true} size='small' color={stateColor} /> :
                  <Text style={{color: stateColor, fontSize: 0.2 * innerSize, fontWeight: '600'}}>{label}</Text>
              }
              <Text style={{color: stateColor, fontSize:0.15*innerSize, fontWeight:'500'}}>{'(' + Math.round(100*state) + ' %)'}</Text>
              <View style={{flex:0.75}} />
            </AnimatedCircle>
          </AnimatedCircle>
        </AnimatedCircle>
      </TouchableOpacity>
    </View>
  );
  }

  _animate(toValue) {
    this._animationFrame = requestAnimationFrame(() => {
      let step = 0.075;
      let newState = this.state.state;
      if (this.state.state < toValue) {
        newState += step;
        if (newState > toValue) {
          newState = toValue;
        }
      }
      else if (this.state.state === toValue) {
        cancelAnimationFrame(this._animationFrame);
        return
      }
      else { // this.state.state > toValue
        newState -= step;
        if (newState < toValue) {
          newState = toValue;
        }
      }

      this.setState({state: newState});

      if (newState !== toValue) {
        this._animate(toValue);
      }
    })
  }
}