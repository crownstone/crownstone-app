
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';

import { colors } from '../styles'
import { Icon } from './Icon';


import {AnimatedCircle} from "./animated/AnimatedCircle";
import {IconCircle} from "./IconCircle";
import { core } from "../../core";

let ALERT_TYPES = {
  fingerprintNeeded : 'fingerPrintNeeded'
};

const FLOATING_CROWNSTONE_LOCATION_ID = null;

class SphereCircleClass extends Component<any, any> {
  initializedPosition: any;
  borderWidth: number;
  innerDiameter: number;
  outerDiameter: number;
  iconSize: number;
  textSize: number;

  showAlert: string = null;

  animationStarted: boolean;
  animating: boolean;
  animatedMoving: boolean;

  previousCircle: any;
  moveAnimationTimeout: any;
  color: any;

  movementDuration: number;
  jumpDuration: number;
  fadeDuration: number;

  unsubscribeSetupEvents = [];
  unsubscribeStoreEvents: any;
  unsubscribeControlEvents = [];
  renderState: any;

  scaledUp = true;

  constructor(props) {
    super(props);

    this.initializedPosition = true;
    let initialX = props.pos.x._value;
    let initialY = props.pos.y._value;

    this.state = {
      top: new Animated.Value(initialY),
      left: new Animated.Value(initialX),
      colorFadeOpacity: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
      setupProgress: 20,
    };

    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 24;
    this.innerDiameter = 2 * props.radius - 4.5 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.70;
    this.textSize = props.radius * 0.23;

    this.animationStarted = false;
    this.animating = false;
    this.animatedMoving = false;

    this.previousCircle = undefined;
    this.moveAnimationTimeout = undefined;

    this.movementDuration = 400;
    this.jumpDuration = 400;
    this.fadeDuration = this.movementDuration;

    this.unsubscribeSetupEvents = [];
  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      // const state = store.getState();
    });

    this.unsubscribeControlEvents.push(core.eventBus.on('viewWasTapped' + this.props.viewId, (data) => {
      this.handleTouchReleased(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeWasTapped' + this.props.viewId + this.props.sphereId, (data) => {
      this.handleTap(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeTouched' + this.props.viewId + this.props.sphereId, (data) => {
      this.handleTouch(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeReleased' + this.props.viewId + this.props.sphereId, (data) => {
      this.handleTouchReleased(data);
    }));
  }

  componentWillUnmount() {
    this.unsubscribeControlEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }

  getSphereName(name, color) {
    let a = 16; let b = 0.6;
    let textSize = Math.max(Math.min(this.textSize, ((a - name.length)/a + b)*this.textSize ), 0.75*this.textSize);

    return (
      <Text
        style={{width: 0.85*this.innerDiameter, height:20, color: color, fontWeight: 'bold', fontSize: textSize, textAlign:'center', paddingTop:2}}
        numberOfLines={1}
        ellipsizeMode={"tail"}
        // adjustsFontSizeToFit={true} this does not work together with ellipse size mode
      >{name}</Text>
    )
  }
  getCircle(sphere) {
    let backgroundColor = colors.green.hex;
    // let textColor = colors.menuBackground.hex;
    // let newColor = colors.csBlue.hex;
    let textColor = colors.white.hex;
    if (sphere.state.present === false) {
      backgroundColor = colors.csBlueDark.hex;
    }

    let innerOffset = 0.5*(this.outerDiameter - this.innerDiameter);
    return (
      <View>
        <View style={{
          borderRadius: this.outerDiameter,
          width: this.outerDiameter,
          height: this.outerDiameter,
          backgroundColor: textColor,
          padding:0,
          margin:0
        }}>
          <AnimatedCircle
            key={this.props.locationId + "_circle"}
            size={this.innerDiameter}
            color={backgroundColor}
            style={{
              position: 'relative',
              top:      innerOffset,
              left:     innerOffset,
              padding:  0,
              margin:   0,
            }}>
            <Icon name={sphere.config.icon || 'c1-sphere'} size={this.iconSize} color={textColor} />
            { this.getSphereName(sphere.config.name, textColor) }
          </AnimatedCircle>
        </View>
      </View>
    );
  }


  _getAlertIcon() {
    let alertSize = this.outerDiameter*0.30;
    return (
      <View style={{position:'absolute', top: 0, left: this.outerDiameter - alertSize}}>
        <IconCircle icon="c1-locationPin1" color="#fff" size={alertSize} backgroundColor={colors.csBlue.hex} borderWidth={3} />
      </View>
    )
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];

    if (!sphere) { return <View />; }

    // do not show the fingerprint required alert bubbles if the user does not want to use indoor localization
    this.renderState = state;
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    return (
      <Animated.View style={[animatedStyle, {position:'absolute',  top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity}]}>
        {this.getCircle(sphere)}
        {this.showAlert !== null ? this._getAlertIcon() : undefined}
      </Animated.View>
    )
  }

  handleTouch(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.scaledUp = true;

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70 }));
    tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, duration: 100}));
    Animated.parallel(tapAnimations).start();
  }

  handleTouchReleased(data) {
    if (this.scaledUp) {
      // top any animation this node was doing.
      this.state.scale.stopAnimation();
      this.state.opacity.stopAnimation();

      this.scaledUp = false;

      let revertAnimations = [];
      revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
      revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
      Animated.parallel(revertAnimations).start();
    }
  }


  handleTap(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.scaledUp = false;

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();

    this.props.selectSphere();
  }
}

export const SphereCircle = Animated.createAnimatedComponent(SphereCircleClass);