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

import { colors } from '../styles'

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

    this.state = {
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      reachable: new Animated.Value(props.forceReachable === true ? 1 : 0),
      pulse: new Animated.Value(0),
    };

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
      this.state.reachable.stopAnimation();
      this.state.pulse.stopAnimation();
      this.state.pulse.setValue(0);

      Animated.timing(this.state.reachable, {toValue: 1, duration: 100}).start(() => { this.animatePulse() });
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
      this.state.reachable.stopAnimation();
      this.state.pulse.stopAnimation();

      let animations = [];
      animations.push(Animated.timing(this.state.reachable, {toValue: 0, duration: 600}))
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
      outputRange: ['rgba(255, 255, 255, 1.0)',  colors.green.rgba(1)]
    });

    let width    = 2*this.props.radius;
    let height   = 2*this.props.radius;
    let overlap  = 0.25;
    let iconSize = 0.5*(width + overlap*width);

    let innerWidth  = 0.95*width;
    let innerWidth2 = 0.85*width;

    return (
      <Animated.View style={[animatedStyle, {position:'absolute', top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity, width:width, height: height, overflow:'hidden'}]}>
        <View style={{position:"absolute", top:0.5*(width-innerWidth),  left:0.5*(width-innerWidth),  width: innerWidth,  height: innerWidth,  borderRadius: 0.5*innerWidth,  borderWidth: 0.03*innerWidth, borderColor: "#fff"}} />
        <Animated.View style={{
          position:"absolute",
          opacity: this.state.reachable,
          top:0.5*(width-innerWidth2),
          left:0.5*(width-innerWidth2),
          width: innerWidth2,
          height: innerWidth2,
          borderRadius: 0.5*innerWidth2,
          borderWidth: 0.1*innerWidth2,
          borderColor: pulseColor,
          backgroundColor:colors.darkBackground.hex
        }} />
        <View style={{position:"absolute", top:0, left:0, flexDirection:'row', alignItems:'center', justifyContent:'flex-start', width:width, height: height, overflow:'hidden'}}>
          <IconCircle icon={this.props.nodeData.locationIcon} size={iconSize} backgroundColor={this.props.nodeData.locationColor} color={colors.white.hex} borderColor={colors.csBlue.hex} style={{position:'relative', top:-0.5*overlap*width, left:0}} />
          <IconCircle icon={this.props.nodeData.deviceIcon} size={iconSize} backgroundColor={colors.csBlue.hex} color="#fff" borderColor={colors.csBlue.hex} style={{position:'relative', top:0.5*overlap*width, left: -overlap*width}} />
        </View>
      </Animated.View>
    )
  }

  handleTouch(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70 }));
    // tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, duration: 100}));
    Animated.parallel(tapAnimations).start();
  }

  handleTouchReleased(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    // revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();
  }

  handleTap(data) {
    this.state.scale.stopAnimation();
    // this.state.opacity.stopAnimation();

    this.state.scale.setValue(1);
    // this.state.opacity.setValue(1);
  }
}

export const MeshElement = Animated.createAnimatedComponent(MeshElementClass);
