import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {colors, screenWidth} from '../styles'

const Actions = require('react-native-router-flux').Actions;

import {IconCircle} from "./IconCircle";
import {eventBus} from "../../util/EventBus";
import {Scheduler} from "../../logic/Scheduler";


class MeshElementClass extends Component<any, any> {
  usage : any;
  borderWidth : number;
  animating : boolean;

  moveAnimationTimeout : any;
  color : any;

  unsubscribeControlEvents = [];
  unsubscribeBeaconEvent : any;

  reachable = false;
  reachableTimeout : any = null;

  constructor(props) {
    super(props);

    this.reachable = this.props.__reachableOverride || false;

    this.state = {
      scale: new Animated.Value(1),
      pulse: new Animated.Value(0),
      width: new Animated.Value(2*this.props.radius),
      height: new Animated.Value(2*this.props.radius),
      locationX: new Animated.Value(0),
      locationY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    };

    if (this.props.__expandOverride) {
      this.handleTouch(null)
    }
  }


  componentDidMount() {
    this.unsubscribeControlEvents.push(eventBus.on('nodeWasTapped'+this.props.id, (data) => {
      this.handleTap(data);
    }));

    this.unsubscribeControlEvents.push(eventBus.on('nodeTouched'+this.props.id, (data) => {
      this.handleTouch(data);
    }));

    this.unsubscribeControlEvents.push(eventBus.on('nodeReleased'+this.props.id, (data) => {
      this.handleTouchReleased(data);
    }));

    this.unsubscribeBeaconEvent = eventBus.on('iBeaconOfValidCrownstone', (data) => {
      if (data.stoneId === this.props.id) {
        this.isReachable();
      }
    });
  }

  animatePulse() {
    if (this.reachable === true) {
      let animations = [];
      this.state.pulse.stopAnimation();
      animations.push(Animated.timing(this.state.pulse, { toValue: 1, duration: 50 }))
      animations.push(Animated.timing(this.state.pulse, { toValue: 0, duration: 250 }))
      Animated.sequence(animations).start();

      this.delayUnreachable();
    }
  }

  delayUnreachable() {
    if (this.reachableTimeout !== null) {
      this.reachableTimeout();
      this.reachableTimeout = null;
    }
    this.reachableTimeout =  Scheduler.scheduleCallback(() => { this.setUnreachable() }, 3000);
  }

  isReachable() {
    if (this.reachableTimeout !== null) {
      this.reachableTimeout();
      this.reachableTimeout = null;
    }

    if (this.reachable === false) {
      this.reachable = true;
      this.state.pulse.stopAnimation();
      this.state.pulse.setValue(0);
    }
    else {
      this.animatePulse()
    }
  }

  setUnreachable() {
    if (this.reachableTimeout !== null) {
      this.reachableTimeout();
      this.reachableTimeout = null;
    }

    if (this.reachable === true) {
      this.reachable = false;
      this.state.pulse.stopAnimation();

      let animations = [];
      animations.push(Animated.timing(this.state.pulse,     {toValue: 0, duration: 600}))
      Animated.parallel(animations).start();
    }
  }


  componentWillUnmount() {
    clearTimeout(this.moveAnimationTimeout);
    this.unsubscribeControlEvents.forEach((unsub) => { unsub() });
  }


  render() {
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    let pulseColor = this.state.pulse.interpolate({
      inputRange: [0,1],
      outputRange: [ colors.csBlue.rgba(1),  colors.green.rgba(1)]
    });

    let width    = 2*this.props.radius;
    let height   = 2*this.props.radius;
    let iconSize = width;

    return (
      <Animated.View
        style={[animatedStyle,
          {position:'absolute',
            top: this.props.pos.y, left: this.props.pos.x,
            width: this.state.width, height: this.state.height,
            overflow:'hidden'}
          ]}>
        <Animated.View style={{position:'absolute', top: this.state.locationY, left: this.state.locationX}}>
          <IconCircle
            icon={this.props.nodeData.locationIcon}
            size={iconSize}
            backgroundColor={colors.green.hex}
            color={colors.white.hex}
            borderColor={this.reachable ? colors.white.hex : colors.csBlue.hex}
            borderWidth={this.reachable ? 5 : undefined}
          />
          <Text style={{
            position:'absolute', top: 0, left: 2.1*this.props.radius,
            lineHeight:height, height: height, width: 0.5*screenWidth,
            fontSize:15
          }}>{this.props.nodeData.locationTitle}</Text>
        </Animated.View>
        <Animated.View style={{
          position:'absolute',
          top: this.state.deviceX,
          left: this.state.deviceY,
          backgroundColor:pulseColor,
          borderRadius: this.props.radius
        }}>
          <IconCircle
            icon={this.props.nodeData.deviceIcon}
            size={iconSize}
            backgroundColor={'transparent'}
            color="#fff"
            borderColor={this.reachable ? colors.green.hex : colors.csBlue.hex}
            borderWidth={this.reachable ? 5 : undefined}
          />
          <Text style={{
            position:'absolute', top: 0, left: 2.1*this.props.radius,
            lineHeight:height, height: height, width: 0.5*screenWidth,
            fontSize:15
          }}>{this.props.nodeData.element.config.name}</Text>
        </Animated.View>
      </Animated.View>
    )
  }

  handleTouch(data) {
    this._stopAnimations();

    let offset = 1.25*this.props.radius;;

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale,      { toValue: 1.35, friction: 4, tension: 70 }));
    tapAnimations.push(Animated.timing(this.state.locationX,  { toValue: 0.8*offset, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.locationY,  { toValue: offset, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.opacity,    { toValue: 1, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.width,      { toValue: 3.5*this.props.radius + 0.5*screenWidth, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.height,     { toValue: 3.5*this.props.radius, duration: 300}));
    Animated.parallel(tapAnimations).start();
  }

  handleTouchReleased(data) {
    this._stopAnimations();

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale,       {toValue: 1, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.locationX,   {toValue: 0, duration: 300}));
    revertAnimations.push(Animated.timing(this.state.locationY,   {toValue: 0, duration: 300}));
    revertAnimations.push(Animated.timing(this.state.opacity,     {toValue: 0, duration: 300}));
    revertAnimations.push(Animated.timing(this.state.width,       {toValue: 2*this.props.radius, duration: 300}));
    revertAnimations.push(Animated.timing(this.state.height,      {toValue: 2*this.props.radius, duration: 300}));
    // revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();
  }

  handleTap(data) {
    this._stopAnimations();

    this.state.scale.setValue(1);
    this.state.locationX.setValue(0);
    this.state.locationY.setValue(0);
    this.state.opacity.setValue(0);
    this.state.width.setValue(2*this.props.radius);
    this.state.height.setValue(2*this.props.radius);
  }

  _stopAnimations() {
    this.state.scale.stopAnimation();
    this.state.locationX.stopAnimation();
    this.state.locationY.stopAnimation();
    this.state.opacity.stopAnimation();
    this.state.width.stopAnimation();
    this.state.height.stopAnimation();
  }
}

export const MeshElement = Animated.createAnimatedComponent(MeshElementClass);
