import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  NativeModules,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import {colors, screenWidth, styles} from '../styles'

const Actions = require('react-native-router-flux').Actions;

import {IconCircle} from "./IconCircle";
import {eventBus} from "../../util/EventBus";
import {Scheduler} from "../../logic/Scheduler";
import {Util} from "../../util/Util";
import {Icon} from "./Icon";
import {AnimatedIconCircle} from "./animated/AnimatedIconCircle";


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

  expanded = false

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
    this.unsubscribeControlEvents.push(eventBus.on('nodeWasTapped' + this.props.viewId + this.props.id, (data) => {
      this.handleTap(data);
    }));

    this.unsubscribeControlEvents.push(eventBus.on('nodeTouched' + this.props.viewId + this.props.id, (data) => {
      this.handleTouch(data);
    }));

    this.unsubscribeControlEvents.push(eventBus.on('nodeReleased' + this.props.viewId + this.props.id, (data) => {
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
      this.forceUpdate()
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
      animations.push(Animated.timing(this.state.pulse, {toValue: 0, duration: 600}))
      Animated.parallel(animations).start();
    }
  }


  componentWillUnmount() {
    clearTimeout(this.moveAnimationTimeout);
    this.unsubscribeControlEvents.forEach((unsub) => { unsub() });
  }

  _getUpdateIcon(iconSize) {
    let size = iconSize / 2.5;
    let borderWidth = 0.08*size;
    let innerSize = size - 2*borderWidth;
    return (
      <View style={[{
        position: 'absolute',
        top: 0,
        left: iconSize - size,
        width:size,
        height:size,
        borderRadius:size * 0.5,
        backgroundColor: colors.white.hex,
      }, styles.centered]}>
        <View style={[{
          width:innerSize,
          height:innerSize,
          borderRadius:innerSize * 0.5,
          backgroundColor: colors.orange.hex
        }, styles.centered]}>
          <Icon name={'c1-update-arrow'} size={innerSize - 2 * borderWidth} color={ colors.white.hex } />
        </View>
      </View>
    )
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

    let fontContainerViewStyle = { position:'absolute', top: 0, left: 2.1*this.props.radius, height: height, width: 0.5*screenWidth, alignItems:'flex-start', justifyContent:'center' };
    let fontViewStyle = { backgroundColor: colors.white.hex, padding: 7, borderRadius:8, borderColor: colors.csBlue.rgba(0.1), borderWidth: 2 };

    let supportedFirmware = Util.versions.canIUse(this.props.nodeData.stone.config.firmwareVersion, '2.1.2');
    return (
      <Animated.View style={[animatedStyle, { position:'absolute', top: this.props.pos.y, left: this.props.pos.x, width: this.state.width, height: this.state.height, overflow:'hidden'}]}>
        <Animated.View style={{position:'absolute', top: this.state.locationY, left: this.state.locationX}}>
          <IconCircle
            icon={this.props.nodeData.locationIcon}
            size={iconSize}
            backgroundColor={colors.green.hex}
            color={colors.white.hex}
            borderColor={this.reachable ? colors.white.hex : colors.csBlue.hex}
            borderWidth={this.reachable ? 5 : undefined}
          />
          <View style={fontContainerViewStyle}>
            <View style={fontViewStyle}>
              <Text style={{fontSize:15}}>{this.props.nodeData.locationTitle}</Text>
            </View>
          </View>
        </Animated.View>
        <View style={{
          position:'absolute',
          top:  this.state.deviceX,
          left: this.state.deviceY,
        }}>
          <AnimatedIconCircle
            icon={this.props.nodeData.deviceIcon}
            size={iconSize}
            backgroundColor={pulseColor}
            color="#fff"
            borderColor={this.reachable ? colors.green.hex : colors.csBlue.hex}
            borderWidth={this.reachable ? 5 : undefined}
          />
          <View style={fontContainerViewStyle}>
            <View style={fontViewStyle}>
              <Text style={{fontSize:15}}>{this.props.nodeData.element.config.name}</Text>
            </View>
          </View>
        </View>
        { supportedFirmware ? undefined : this._getUpdateIcon(iconSize) }
      </Animated.View>
    )
  }

  handleTouch(data) {
    if (this.expanded) {
      this._revert(data);
    }
    else {
      this._expand(data);
    }
  }

  handleTouchReleased(data) {

  }

  _expand(data) {
    this.expanded = true;
    this._stopAnimations();

    let offset = 1.25*this.props.radius;

    let supportedFirmware = Util.versions.canIUse(this.props.nodeData.stone.config.firmwareVersion, '2.1.2');
    if (!supportedFirmware && data) {
      if (data.dx > this.props.radius && data.dy > -this.props.radius) {
        Alert.alert(
Languages.alert("MeshElement", "_Update_Required__The_fir_header")(),
Languages.alert("MeshElement", "_Update_Required__The_fir_body")(),
[{text: Languages.alert("MeshElement", "_Update_Required__The_fir_left")()}]);
      }
    }

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale,      { toValue: 1.35, friction: 4, tension: 70 }));
    tapAnimations.push(Animated.timing(this.state.locationX,  { toValue: 0.8*offset, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.locationY,  { toValue: offset, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.opacity,    { toValue: 1, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.width,      { toValue: 3.5*this.props.radius + 0.5*screenWidth, duration: 300}));
    tapAnimations.push(Animated.timing(this.state.height,     { toValue: 3.5*this.props.radius, duration: 300}));
    Animated.parallel(tapAnimations).start();
  }

  _revert(data) {
    this.expanded = false;
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

  handleTap(data) {}

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
