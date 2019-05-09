import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomCircle", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Animated,
  Text,
  View
} from 'react-native';

import { styles, colors } from '../styles'
import { getCurrentPowerUsageInLocation } from '../../util/DataUtil'
import { Icon } from './Icon';
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'


import { Svg, Circle } from 'react-native-svg';
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {AnimatedCircle} from "./animated/AnimatedCircle";
import {IconCircle} from "./IconCircle";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

let ALERT_TYPES = {
  fingerprintNeeded : 'fingerPrintNeeded'
};


class RoomCircleClass extends LiveComponent<any, any> {
  initializedPosition: any;
  energyLevels: any;
  usage: any;
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
  color: any;

  unsubscribeSetupEvents = [];
  unsubscribeStoreEvents: any;
  unsubscribeControlEvents = [];
  renderState: any;

  scaledUp = true;
  touching = false;
  touchTimeout = null;


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
      progress: 0
    };

    this.energyLevels = [
      {min: 0, max: 50, color: colors.green.hex},
      {min: 50, max: 200, color: colors.orange.hex},
      {min: 200, max: 1000, color: colors.red.hex},
      {min: 1000, max: 4000, color: colors.darkRed.hex},
    ];

    this.usage = 0;
    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 15;
    this.innerDiameter = 2 * props.radius - 4.5 * this.borderWidth;
    this.outerDiameter = 2 * props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;

    this.animationStarted = false;
    this.animating = false;
    this.animatedMoving = false;

    this.previousCircle = undefined;

    this.unsubscribeSetupEvents = [];

    // set the usage initially
    this.usage = getCurrentPowerUsageInLocation(core.store.getState(), props.sphereId, props.locationId);
  }


  componentDidMount() {
    this.unsubscribeSetupEvents.push(core.eventBus.on("dfuStoneChange", () => {
      this.forceUpdate();
    }));


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
      this.handleTouchReleased(data);
    }));

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
    this.unsubscribeSetupEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeControlEvents.forEach((unsubscribe) => { unsubscribe(); });
    this.unsubscribeStoreEvents();
  }


  _getLevel(usage) {
    for (let i = 0; i < this.energyLevels.length; i++) {
      if (usage < this.energyLevels[i].max)
        return i
    }
    return this.energyLevels.length - 1;
  }

  _areDfuStonesInLocation() {
    let stonesInSetup = DfuStateHandler.getDfuHandles();
    for (let i = 0; i < stonesInSetup.length; i++) {
      if (MapProvider.stoneHandleMap[stonesInSetup[i]] && MapProvider.stoneHandleMap[stonesInSetup[i]].locationId === this.props.locationId) {
        return true;
      }
    }
    return false;
  }


  _getColor(usage, prev = false) {
    if (this.props.viewingRemotely === true) {
      return colors.green.rgba(0.8);
    }

    if (this._areDfuStonesInLocation() === true) {
      return colors.purple.hex;
    }


    let level = this._getLevel(usage);
    if (prev) {
      if (level == 0) {
        return colors.lightGray.hex;
      }
      else {
        return this.energyLevels[level-1].color;
      }
    }
    return this.energyLevels[level].color;
  }

  getIcon() {
    if (this._areDfuStonesInLocation() === true) {
      return <Icon name="ios-settings" size={this.iconSize*1.3} color='#ffffff'/>;
    }

    let icon = core.store.getState().spheres[this.props.sphereId].locations[this.props.locationId].config.icon;
    return <Icon name={icon} size={this.iconSize} color='#ffffff' />;

  }

  getCircle() {
    let newColor = this._getColor(this.usage);
    let innerOffset = 0.5*(this.outerDiameter - this.innerDiameter);
    return (
      <View>
        <View style={{
          borderRadius: this.outerDiameter,
          width: this.outerDiameter,
          height: this.outerDiameter,
          backgroundColor: colors.white.hex,
          padding:0,
          margin:0
        }}>
          {this._getUsageCircle(this.usage, newColor)}
          <AnimatedCircle
            key={this.props.locationId + "_circle"}
            size={this.innerDiameter}
            color={newColor}
            style={{
              position: 'relative',
              top:      innerOffset,
              left:     innerOffset,
              padding:  0,
              margin:   0,
            }}>
            <View style={[styles.centered,{height:0.5*this.innerDiameter}]}>
            {this.getIcon()}
            </View>
            {this.props.viewingRemotely ? undefined : <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:this.textSize}}>{ lang("_W",this.usage) }</Text>}
          </AnimatedCircle>
        </View>
      </View>
    );
  }


  _getUsageCircle(usage, newColor) {
    let colorOfLowerLayer = this._getColor(usage, true);
    let pathLength = Math.PI * 2 * (this.props.radius - this.borderWidth);

    let levelProgress = this._getFactor(usage);
    return (
      <View style={{position:'absolute', top:0, left:0}}>
        <Svg width={this.outerDiameter} height={this.outerDiameter}>
          <Circle
            r={this.props.radius - this.borderWidth}
            stroke={colorOfLowerLayer}
            strokeWidth={this.borderWidth}
            x={this.props.radius}
            y={this.props.radius}
            strokeLinecap="round"
            fill="white"
          />
          {usage ? <Circle
            r={this.props.radius - this.borderWidth}
            stroke={newColor}
            strokeWidth={this.borderWidth}
            strokeDasharray={[pathLength*levelProgress,pathLength]}
            rotation="-89.9"
            x={this.props.radius}
            y={this.props.radius}
            strokeLinecap="round"
            fill="rgba(0,0,0,0)"
          /> : undefined}
        </Svg>
      </View>
    )
  }

  _getProgressCircle(percentage) {
    if (percentage > 0) {
      let pathLength = Math.PI * 2 * (this.props.radius - this.borderWidth);
      return (
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <Svg width={this.outerDiameter} height={this.outerDiameter}>
            <Circle
              r={this.props.radius - 10}
              stroke={colors.white.blend(colors.purple, percentage).hex}
              strokeWidth={10}
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

  _getFactor(usage) {
    let level = this._getLevel(usage);
    let minW = this.energyLevels[level].min;
    let maxW = this.energyLevels[level].max;
    return (usage-minW) / (maxW-minW);
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
    const state = core.store.getState();

    // do not show the fingerprint required alert bubbles if the user does not want to use indoor localization
    if (state.app.indoorLocalizationEnabled) {
      let canDoLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
      this.showAlert = null;
      if (this.props.viewingRemotely !== true) {
        if (canDoLocalization === true && state.spheres[this.props.sphereId].locations[this.props.locationId].config.fingerprintRaw === null) {
          this.showAlert = ALERT_TYPES.fingerprintNeeded;
        }
      }
    }
    else {
      this.showAlert = null;
    }

    this.renderState = state;
    const animatedStyle = {
      transform: [
        { scale: this.state.scale },
      ]
    };

    return (
      <Animated.View style={[animatedStyle, {position:'absolute',  top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.opacity}]}>
        <View>
          {this.getCircle()}
          {this.showAlert !== null ? this._getAlertIcon() : undefined}
          {this._getProgressCircle(this.state.progress) }
        </View>
      </Animated.View>
    )
  }

  handleTouch(data) {
    // stop any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.scaledUp = true;

    let tapAnimations = [];
    tapAnimations.push(Animated.spring(this.state.scale, { toValue: 1.25, friction: 4, tension: 70 }));
    tapAnimations.push(Animated.timing(this.state.opacity, {toValue: 0.2, duration: 100}));
    Animated.parallel(tapAnimations).start();

    this.touching = true;
    this.touchTimeout = setTimeout(() => { this._onHoldAnimation(); }, 250);
  }

  _onHoldAnimation() {
    Animated.timing(this.state.opacity, {toValue: 1, duration: 100}).start(() => { this._onHoldProgress() })
  }

  _onHoldProgress() {
    if (this.touching) {
      let nextStep = Math.min(1, this.state.progress + 0.04);
      this.setState({ progress: nextStep });
      if (nextStep >= 0.95) {
        this.props.onHold();
        this._clearHold();
      } else {
        this.touchTimeout = setTimeout(() => { this._onHoldProgress(); }, 20);
      }
    }
  }

  _clearHold() {
    this.touching = false;
    if (this.state.progress > 0) {
      this.setState({ progress: 0 })
    }
    clearTimeout(this.touchTimeout);
  }

  handleTouchReleased(data) {
    if (this.scaledUp) {
      // stop any animation this node was doing.
      this.state.scale.stopAnimation();
      this.state.opacity.stopAnimation();

      this.scaledUp = false;

      let revertAnimations = [];
      revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
      revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
      Animated.parallel(revertAnimations).start();
    }


    this._clearHold();
  }

  handleDragging(data) {
    // stop any animation this node was doing.
    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.scaledUp = false;

    let revertAnimations = [];
    revertAnimations.push(Animated.timing(this.state.scale, {toValue: 1, duration: 100}));
    revertAnimations.push(Animated.timing(this.state.opacity, {toValue: 1, duration: 100}));
    Animated.parallel(revertAnimations).start();

    this._clearHold();
  }

  handleTap(data) {
    this.scaledUp = false;
    let handled = false;

    this.state.scale.stopAnimation();
    this.state.opacity.stopAnimation();

    this.state.scale.setValue(1);
    this.state.opacity.setValue(1);

    if (this.touching === true) {
      if (this.showAlert !== null) {
        if (this.showAlert === ALERT_TYPES.fingerprintNeeded) {
          if (data.dx > this.outerDiameter*0.70 && data.dy > -this.outerDiameter*0.3) {
            handled = true;
            NavigationUtil.navigate("RoomTraining_roomSize",{ sphereId: this.props.sphereId, locationId: this.props.locationId });
          }
        }
      }
      if (handled === false) {
        NavigationUtil.navigate("RoomOverview",{ sphereId: this.props.sphereId, locationId: this.props.locationId });
      }
    }
    this._clearHold();
  }
}

export const RoomCircle = Animated.createAnimatedComponent(RoomCircleClass);