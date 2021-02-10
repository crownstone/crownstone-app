import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';
import {colors} from "../../styles";
import {Icon} from "../../components/Icon";
import {IconCircle} from "../../components/IconCircle";
import { core } from "../../../core";


let ALERT_TYPES = {
  fingerprintNeeded : 'fingerPrintNeeded'
};

const FLOATING_CROWNSTONE_LOCATION_ID = null;

class LocalizationDebugCircleClass extends Component<any, any> {
  initializedPosition: any;
  borderWidth: number;
  innerDiameter: number;
  outerDiameter: number;
  iconSize: number;
  textSize: number;

  animationStarted: boolean;
  animating: boolean;
  animatedMoving: boolean;

  previousCircle: any;
  moveAnimationTimeout: any;
  color: any;

  movementDuration: number;
  jumpDuration: number;
  fadeDuration: number;

  unsubscribeControlEvents = [];
  renderState: any;

  consecutiveMatches = 0;

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
    this.borderWidth = props.radius / 15;
    this.innerDiameter = 2 * props.radius - 2 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.72;
    this.textSize = props.radius * 0.22;

    this.animationStarted = false;
    this.animating = false;
    this.animatedMoving = false;

    this.previousCircle = undefined;
    this.moveAnimationTimeout = undefined;

    this.movementDuration = 400;
    this.jumpDuration = 400;
    this.fadeDuration = this.movementDuration;
  }


  componentDidMount() {
    this.unsubscribeControlEvents.push(core.eventBus.on('nodeWasTapped' + this.props.viewId + this.props.locationId, (data) => {
      this.handleTap(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeTouched' + this.props.viewId + this.props.locationId, (data) => {
      this.handleTouch(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeReleased' + this.props.viewId + this.props.locationId, (data) => {
      this.handleTouchReleased(data);
    }));

    this.unsubscribeControlEvents.push(core.eventBus.on('nodeDragging' + this.props.viewId + this.props.locationId, (data) => {
      this.handleDragging(data);
    }));
  }



  componentWillUnmount() {
    this.unsubscribeControlEvents.forEach((unsubscribe) => { unsubscribe(); });
  }


  getIcon() {
    let icon = core.store.getState().spheres[this.props.sphereId].locations[this.props.locationId].config.icon;
    return <Icon name={icon} size={this.iconSize} color='#ffffff' />;
  }

  getCircle() {
    let p = '...';
    if (this.props.probabilityData.probability) {
      p = this.props.probabilityData.probability.toExponential(1)
    }

    return (
      <View>
        <View style={{
          borderRadius: this.outerDiameter,
          width: this.outerDiameter,
          height: this.outerDiameter,
          backgroundColor: colors.white.hex,
          alignItems:'center',
          justifyContent:'center'
        }}>
            <View style={{
              borderRadius: this.innerDiameter,
              width: this.innerDiameter,
              height: this.innerDiameter,
              backgroundColor: this.props.backgroundColor,
              alignItems:'center',
              justifyContent:'center'
            }}>
              {this.getIcon()}
              <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:this.textSize}}>{ "P:" + p }</Text>
              <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:this.textSize - 2}}>{ "S,M:" + this.props.probabilityData.sampleSize + "," + this.consecutiveMatches }</Text>
            </View>
        </View>
      </View>
    );
  }


  _getInLocationIcon() {
    let alertSize = this.outerDiameter*0.30;
    return (
      <View style={{position:'absolute', top: 0, left: this.outerDiameter - alertSize}}>
        <IconCircle icon="c1-locationPin1" color="#fff" size={alertSize} backgroundColor={colors.csBlue.hex} borderWidth={3} />
      </View>
    )
  }
  _getIsAppLocationIcon() {
    let alertSize = this.outerDiameter*0.33;
    return (
      <View style={{position:'absolute', top: 0, right: this.outerDiameter - alertSize}}>
        <IconCircle icon="c1-locationPin1" color="#fff" size={alertSize} backgroundColor={colors.blue.hex} borderWidth={3} />
      </View>
    )
  }
  _getIsKnnLocationIcon() {
    let alertSize = this.outerDiameter*0.27;
    return (
      <View style={{position:'absolute', top: this.outerDiameter - alertSize, left: this.outerDiameter - alertSize}}>
        <IconCircle icon="c1-locationPin1" color="#fff" size={alertSize} backgroundColor={colors.green.hex} borderWidth={3} />
      </View>
    )
  }

  render() {
    const store = core.store;
    const state = store.getState();

    this.renderState = state;
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    if (this.props.inLocation) {
      this.consecutiveMatches += 1;
    }
    else {
      this.consecutiveMatches = 0;
    }

    return (
      <Animated.View style={[animatedStyle, {position:'absolute',  top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity}]}>
        <View>
          {this.getCircle()}
          {this.props.inLocation    ? this._getInLocationIcon() : undefined}
          {this.props.isAppLocation ? this._getIsAppLocationIcon() : undefined}
          {this.props.isKnnLocation ? this._getIsKnnLocationIcon() : undefined}
        </View>
      </Animated.View>
    )
  }

  handleTouch(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70 }));
    tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, duration: 100}));
    Animated.parallel(tapAnimations).start();
  }

  handleTouchReleased(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();
  }

  handleDragging(data) {
    // top any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();
  }

  handleTap(data) {

  }
}

export const LocalizationDebugCircle = Animated.createAnimatedComponent(LocalizationDebugCircleClass);