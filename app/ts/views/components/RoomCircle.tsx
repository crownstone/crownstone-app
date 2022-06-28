import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomCircle", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  Animated,
  Text, TouchableOpacity,
  View
} from "react-native";

import { styles, colors } from '../styles'
import { Icon } from './Icon';
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Circle } from "./Circle";
import Svg from "react-native-svg";
import { Circle as SvgCircle} from "react-native-svg";
import {Get} from "../../util/GetUtil";
import { DataUtil, enoughCrownstonesInLocationsForIndoorLocalization } from "../../util/DataUtil";
import { IconCircle } from "./IconCircle";
import { FingerprintUtil } from "../../util/FingerprintUtil";



class RoomCircleClass extends LiveComponent<any, {top: any, left: any, scale: any, opacity: any, tapAndHoldProgress: any, showErrorState: boolean}> {
  initializedPosition: any;
  usage: any;
  borderWidth: number;
  innerDiameter: number;
  outerDiameter: number;
  iconSize: number;
  textSize: number;

  animating = false;

  previousCircle: any;
  color: any;

  unsubscribeStoreEvents: any;
  unsubscribeControlEvents = [];

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
      tapAndHoldProgress: 0,
      showErrorState: DataUtil.areThereActiveStonesWithErrorsInLocation(this.props.sphereId, this.props.locationId),
    };


    this.usage = 0;
    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 16;
    this.innerDiameter = 2 * props.radius - 3 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;

    this.previousCircle = undefined;


  }


  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      const state = core.store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }

      // in the case the room is deleted, do not redraw.
      if (state.spheres[this.props.sphereId].locations[this.props.locationId] === undefined) {
        return;
      }

      let change = data.change;

      if (
        change.updateStoneErrors     ||
        change.removeSphere          ||
        change.changeSpheres
      ) {
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

  getLocationIcon() {
    let alertSize = this.outerDiameter*0.30;
    return (
      <TouchableOpacity
        style={{position:'absolute', top: 0, left: this.outerDiameter - alertSize}}
        onPress={() => { NavigationUtil.launchModal("SetupLocalization",{sphereId: this.props.sphereId, fromOverview: true}); }}
      >
        <IconCircle icon="c1-locationPin1" color="#fff" size={alertSize} backgroundColor={colors.csBlue.hex} borderWidth={3} />
      </TouchableOpacity>
    )
  }


  getIcon() {
    let icon = Get.location(this.props.sphereId, this.props.locationId)?.config?.icon || null;
    if (this.state.showErrorState) {
      icon = 'ion5-warning'
    }
    return <Icon name={icon} size={this.iconSize} color='#ffffff' />;

  }

  getCircle() {
    let innerColor = colors.green.rgba(0.75);
    if (this.state.showErrorState) {
      innerColor = colors.csOrange.rgba(0.6);
    }
    let innerOffset = 0.5*(this.outerDiameter - this.innerDiameter);
    return (
      <View>
        <Circle size={this.outerDiameter} color={colors.white.hex}>
          <Circle size={this.outerDiameter - (2/3)*innerOffset} color={colors.white.hex} borderColor={colors.lightGray.hex} borderWidth={ (1/3)*innerOffset }>
            <Circle size={this.innerDiameter} color={innerColor}>
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
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    let showLocalizationIcon = false;
    // do not show the fingerprint required alert bubbles if the user does not want to use indoor localization
    if (state.app.indoorLocalizationEnabled) {
      let canDoLocalization = enoughCrownstonesInLocationsForIndoorLocalization(this.props.sphereId);
      if (this.props.viewingRemotely !== true) {
        if (canDoLocalization && !FingerprintUtil.hasFingerprints(this.props.sphereId, this.props.locationId)) {
          showLocalizationIcon = true;
        }
      }
    }

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
        {showLocalizationIcon ? this.getLocationIcon() : undefined}
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
