import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomCircle", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Animated,
  Text, TouchableOpacity,
  View
} from "react-native";

import { styles, colors } from '../styles'
import { getCurrentPowerUsageInLocation } from '../../util/DataUtil'
import { Icon } from './Icon';
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Circle } from "./Circle";
import Svg from "react-native-svg";
import { Circle as SvgCircle} from "react-native-svg";
import {Get} from "../../util/GetUtil";



class RoomCircleClass extends LiveComponent<any, {top: any, left: any, scale: any, opacity: any, tapAndHoldProgress: any}> {
  initializedPosition: any;
  usage: any;
  borderWidth: number;
  innerDiameter: number;
  outerDiameter: number;
  iconSize: number;
  textSize: number;

  animationStarted = false;
  animating = false;
  animatedMoving = false;

  previousCircle: any;
  color: any;

  unsubscribeStoreEvents: any;
  unsubscribeControlEvents = [];
  renderState: any;

  scaledUp = true;
  touching = false;
  touchTimeout = null;
  touchAnimation = null;
  disableTouch = false;
  moveDetected = false;
  tapRegistered = false;
  tapStart : number = 0;

  cleanupRequired = false;

  constructor(props) {
    super(props);

    this.initializedPosition = true;
    let initialX = props.pos.x._value;
    let initialY = props.pos.y._value;

    this.state = {
      top: new Animated.Value(initialY),
      left: new Animated.Value(initialX),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      tapAndHoldProgress: 0
    };

    // this.energyLevels = [
    //   {min: 0, max: 50, color: colors.green.hex},
    //   {min: 50, max: 200, color: colors.orange.hex},
    //   {min: 200, max: 1000, color: colors.red.hex},
    //   {min: 1000, max: 4000, color: colors.darkRed.hex},
    // ];

    this.usage = 0;
    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 16;
    this.innerDiameter = 2 * props.radius - 3 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;

    this.previousCircle = undefined;

    // set the usage initially
    this.usage = getCurrentPowerUsageInLocation(core.store.getState(), props.sphereId, props.locationId);
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      const state = core.store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }
      // only redraw if the power usage changes or if the settings of the room change
      let usage = getCurrentPowerUsageInLocation(state, this.props.sphereId, this.props.locationId);

      // in the case the room is deleted, do not redraw.
      if (state.spheres[this.props.sphereId].locations[this.props.locationId] === undefined) {
        return;
      }

      if (usage !== this.usage || state.spheres[this.props.sphereId].locations[this.props.locationId].config != this.renderState.spheres[this.props.sphereId].locations[this.props.locationId].config) {
        this.usage = usage;
        this.forceUpdate();
      }
    });

    this.unsubscribeControlEvents.push(core.eventBus.on('viewWasTouched' + this.props.viewId, (data) => {
      this.cleanupRequired = false;
      this.moveDetected    = false;
    }));


    this.unsubscribeControlEvents.push(core.eventBus.on('viewWasMultitapped' + this.props.viewId, (data) => {
      this.disableTouch = true;
      this.handleTouchReleased();
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('viewReleased' + this.props.viewId, (data) => {
      this.handleTouchReleased();
      this.disableTouch = false;
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('userDragEvent' + this.props.viewId, (data) => {
      this.moveDetected = true;
      this.handleDragging();
    }));
  }



  componentWillUnmount() {
    this.unsubscribeControlEvents.forEach((unsubscribe) => { unsubscribe(); });
    clearTimeout(this.touchTimeout);
    cancelAnimationFrame(this.touchAnimation);
    this.unsubscribeStoreEvents();
  }


  getIcon() {
    let icon = core.store.getState()?.spheres[this.props.sphereId]?.locations[this.props.locationId]?.config?.icon || null;
    return <Icon name={icon} size={this.iconSize} color='#ffffff' />;

  }

  getCircle() {
    let newColor = colors.green.rgba(0.75);
    let innerOffset = 0.5*(this.outerDiameter - this.innerDiameter);
    return (
      <View>
        <Circle size={this.outerDiameter} color={colors.white.hex}>
          <Circle size={this.outerDiameter - (2/3)*innerOffset} color={colors.white.hex} borderColor={colors.lightGray.hex} borderWidth={ (1/3)*innerOffset }>
            <Circle size={this.innerDiameter} color={newColor}>
              {this.getIcon()}
            </Circle>
          </Circle>
        </Circle>
      </View>
    );
  }


  _getTabAndHoldProgressCircle(percentage) {
    if (percentage > 0) {
      let pathLength = Math.PI * 2 * (this.props.radius - this.borderWidth);
      return (
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <Svg width={this.outerDiameter} height={this.outerDiameter}>
            <SvgCircle
              r={this.props.radius - 10}
              stroke={colors.white.blend(colors.blue, percentage).hex}
              strokeWidth={10*percentage}
              strokeDasharray={[pathLength * percentage, pathLength]}
              rotation="-89.9"
              x={this.props.radius}
              y={this.props.radius}
              strokeLinecap="round"
              fill="rgba(0,0,0,0)"
            />
          </Svg>
        </View>
      );
    }
  }

  render() {
    const state = core.store.getState();


    this.renderState = state;
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    let room = Get.location(this.props.sphereId, this.props.locationId);

    return (
      <TouchableOpacity
        onPressIn={(e)   => {
          this.props.touch();
          this.handleTouch();
        }}
        onPressOut={(e)  => {
          this.checkIfTapped()
          if (this.cleanupRequired) {
            this.handleTouchReleased()
          }
        }}
        onPress={() => { this.handleTap() }}
        activeOpacity={1.0}
      >
      <Animated.View
        style={[animatedStyle, {position:'absolute',  top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity}]}
        testID={`RoomCircle${room?.config?.cloudId}`}
      >
        {this.getCircle()}
        {this._getTabAndHoldProgressCircle(this.state.tapAndHoldProgress) }
      </Animated.View>
      </TouchableOpacity>
    );
  }

  checkIfTapped() {
    setTimeout(() => {
      if (Date.now() - this.tapStart < 500) {
        if (this.moveDetected === false && this.tapRegistered === false) {
          this.handleTap();
        }
      }
    }, 25);
  }

  handleTouch() {
    if (this.disableTouch) { return; }

    this.tapStart = Date.now();

    // stop any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.scaledUp = true;
    this.cleanupRequired = true;

    if (this.props.allowTap) {
      let tapAnimations = [];
      this.animating = true;
      tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70, useNativeDriver: false}));
      tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, useNativeDriver: false, duration: 100}));
      Animated.parallel(tapAnimations).start(() => { this.animating = false; });

      this.touching = true;
      this.touchTimeout = setTimeout(() => { this._onHoldAnimation(); }, 250);
    }
  }

  _onHoldAnimation() {
    Animated.timing(this.state.opacity, {toValue: 1, useNativeDriver: false, duration: 100}).start(() => { this._onHoldProgress() })
  }

  _onHoldProgress() {
    if (!this.props.showHoldAnimation) {
      if (this.state.tapAndHoldProgress !== 0) {
        this.setState({tapAndHoldProgress:0});
      }
      return;
    }

    if (!this.touching) { return; }

    let nextStep = Math.min(1, this.state.tapAndHoldProgress + 0.03);
    this.setState({ tapAndHoldProgress: nextStep });
    if (nextStep >= 0.95) {
      this.props.onHold();
      this._clearHold();
    }
    else {
      this.touchAnimation = requestAnimationFrame(() => { this._onHoldProgress(); });
    }
  }

  _clearHold() {
    this.touching = false;
    if (this.state.tapAndHoldProgress > 0) {
      this.setState({ tapAndHoldProgress: 0 })
    }
    clearTimeout(this.touchTimeout);
    cancelAnimationFrame(this.touchAnimation);
  }

  handleTouchReleased() {
    if (this.scaledUp) {
      // stop any animation this node was doing.
      this.revertSize();
    }

    this._clearHold();
  }

  handleDragging() {
    // stop any animation this node was doing.
    this.revertSize();

    this._clearHold();
  }

  revertSize() {
    if (this.animating) {
      this.state.scale.stopAnimation();
      this.state.opacity.stopAnimation();
    }

    if (this.state.scale._value === 1 && this.state.opacity._value === 1) { return; }

    let revertAnimations = [];
    this.animating = true;
    revertAnimations.push(Animated.timing(this.state.scale,   {toValue: 1, useNativeDriver: false, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, useNativeDriver: false, duration: 100}));
    Animated.parallel(revertAnimations).start(() => {this.animating = false; this.scaledUp = false;});
  }

  handleTap() {
    if (!this.props.allowTap) { return; }

    this.scaledUp = false;

    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.state.scale.setValue(1);
    this.state.opacity.setValue(1);

    NavigationUtil.navigate( "RoomOverview",{ sphereId: this.props.sphereId, locationId: this.props.locationId });
    this.tapRegistered = true;
    setTimeout(() => { this.tapRegistered = false; }, 50);
    this._clearHold();
  }
}

export const RoomCircle = Animated.createAnimatedComponent(RoomCircleClass);
