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

import { styles, screenWidth, screenHeight, colors } from '../styles'
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../../ExternalConfig'
import { getCurrentPowerUsageInLocation } from '../../util/DataUtil'
import { PresentUsers } from './PresentUsers'
import { Icon } from './Icon';
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'
import { LOG } from '../../logging/Log';
const Actions = require('react-native-router-flux').Actions;

import { Svg, Circle } from 'react-native-svg';
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {stones} from "../../cloud/sections/stones";
import {AnimatedCircle} from "./animated/AnimatedCircle";

class RoomCircleClass extends Component<any, any> {
  initializedPosition : any;
  energyLevels : any;
  usage : any;
  borderWidth : number;
  innerDiameter : number;
  outerDiameter : number;
  iconSize : number;
  textSize : number;

  animationStarted : boolean;
  animating : boolean;
  animatedMoving : boolean;

  previousCircle : any;
  moveAnimationTimeout : any;
  color : any;

  movementDuration : number;
  jumpDuration : number;
  fadeDuration : number;

  unsubscribeSetupEvents : any;
  unsubscribe : any;
  unsubscribeStoreEvents : any;
  renderState : any;

  constructor(props) {
    super();

    this.initializedPosition = true;
    let initialOpacity = 1;
    let initialX = props.pos.x._value;
    let initialY = props.pos.y._value;

    this.state = {
      top: new Animated.Value(initialY),
      left: new Animated.Value(initialX),
      colorFadeOpacity: new Animated.Value(0),
      componentOpacity: new Animated.Value(initialOpacity),
      setupProgress: 20,
    };

    this.energyLevels = [
      {min: 0,    max:50,    color: colors.green.hex},
      {min: 50,   max:200,   color: colors.orange.hex},
      {min: 200,  max:1000,  color: colors.red.hex},
      {min: 1000, max:4000,  color: colors.darkRed.hex},
    ];

    this.usage = 0;
    this.props = props;
    // calculate the size of the circle based on the screen size
    this.borderWidth = props.radius / 15;
    this.innerDiameter = 2*props.radius - 4.5 * this.borderWidth;
    this.outerDiameter = 2*props.radius;
    this.iconSize = props.radius * 0.8;
    this.textSize = props.radius * 0.25;

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

  componentWillMount() {
    // set the usage initially
    this.usage = getCurrentPowerUsageInLocation(this.props.store.getState(), this.props.sphereId, this.props.locationId);
  }

  componentDidMount() {
    const { store } = this.props;

    if (this.props.locationId === null) {
      this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupCancelled", (handle) => {
        this.setState({setupProgress: 20});
      }));
      this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupInProgress", (data) => {
        this.setState({setupProgress: data.progress});
      }));
      this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupComplete", (handle) => {
        this.setState({setupProgress: 20});
      }));
    }

    this.unsubscribeSetupEvents.push(this.props.eventBus.on("dfuStoneChange", () => {
      this.forceUpdate()
    }));


    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      const state = store.getState();
      if (state.spheres[this.props.sphereId] === undefined) {
        return;
      }
      // only redraw if the power usage changes or if the settings of the room change
      let usage = getCurrentPowerUsageInLocation(state, this.props.sphereId, this.props.locationId);

      // in the case the room is deleted, do not redraw.
      if (this.props.locationId !== null && state.spheres[this.props.sphereId].locations[this.props.locationId] === undefined) {
        return;
      }

      if (this.props.locationId !== null) {
        if (usage !== this.usage || state.spheres[this.props.sphereId].locations[this.props.locationId].config != this.renderState.spheres[this.props.sphereId].locations[this.props.locationId].config) {
          this.usage = usage;
          this.forceUpdate();
        }
      }
      else if (usage !== this.usage) {
        this.usage = usage;
        this.forceUpdate();
      }

      let change = data.change;
      if (
        (change.userPositionUpdate && change.userPositionUpdate.locationIds[this.props.locationId])
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUpdate(nextProps) {
    if (this.props.hover === false && nextProps.hover === true) {
      Animated.timing(this.state.componentOpacity, {toValue: 0.5, duration:50}).start();
    }
    else if (this.props.hover === true && nextProps.hover === false) {
      Animated.timing(this.state.componentOpacity, {toValue: 1, duration:50}).start();
    }
  }


  componentWillUnmount() {
    clearTimeout(this.moveAnimationTimeout);
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.unsubscribeStoreEvents();
  }


  _getLevel(usage) {
    for (let i = 0; i < this.energyLevels.length; i++) {
      if (usage < this.energyLevels[i].max)
        return i
    }
    return this.energyLevels.length-1;
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
      return colors.notConnected.hex;
    }

    if (this._areDfuStonesInLocation() === true) {
      return colors.purple.hex;
    }

    if (this.props.locationId === null && this.props.seeStonesInSetupMode === true) {
      if (prev)  {
        return colors.lightGray.hex;
      }
      return colors.blinkColor1.hex;
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

    if (this.props.locationId === null && this.props.seeStonesInSetupMode === true) {
      let smallSize = this.iconSize*1.1*0.6;
      return (
        <View style={{width:this.iconSize*1.1, height: this.iconSize}}>
          <Icon name="ios-sunny" size={smallSize} color={colors.blinkColor2.hex} style={{position:'absolute', top:-smallSize*0.024, left:smallSize*0.46}} />
          <Icon name="c2-crownstone" size={this.iconSize*1.1} color='#ffffff' style={{position:'absolute', top:this.iconSize*0.15, left:0}} />
        </View>
      )
    }
    else if (this.props.locationId === null) {
      return <Icon name="c2-pluginFilled" size={this.iconSize} color='#ffffff'/>;
    }
    else {
      let icon = this.props.store.getState().spheres[this.props.sphereId].locations[this.props.locationId].config.icon;
      return <Icon name={icon} size={this.iconSize} color='#ffffff' />;
    }

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
          backgroundColor:'#ffffff',
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
            {this.props.viewingRemotely ? undefined : <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:this.textSize}}>{this.usage + " W"}</Text>}
          </AnimatedCircle>
        </View>
      </View>
    );
  }


  _getUsageCircle(usage, newColor) {
    let colorOfLowerLayer = this._getColor(usage, true);
    let pathLength = Math.PI * 2 * this.props.radius;
    if (usage == 0 && !(this.props.locationId === null && this.props.seeStonesInSetupMode === true)) {
      return (
        <Svg style={{
          width: this.outerDiameter,
          height: this.outerDiameter,
          position:'absolute',
          top:0,left:0
        }}>
          <Circle
            r={this.props.radius - this.borderWidth}
            stroke={colorOfLowerLayer}
            strokeWidth={this.borderWidth}
            strokeDasharray={[pathLength,pathLength]}
            rotate="-89.9"
            x={this.props.radius}
            y={this.props.radius}
            strokeLinecap="round"
            fill="white"
          />
        </Svg>
      );
    }

    let levelProgress = this._getFactor(usage);
    if (this.props.locationId === null && this.props.seeStonesInSetupMode === true) {
      levelProgress = this.state.setupProgress / 20;
    }

    return (
      <Svg style={{
        width: this.outerDiameter,
        height: this.outerDiameter,
        position:'absolute',
        top:0,left:0
      }}>
        <Circle
          r={this.props.radius - this.borderWidth}
          stroke={colorOfLowerLayer}
          strokeWidth={this.borderWidth}
          strokeDasharray={[pathLength,pathLength]}
          rotate="-89.9"
          x={this.props.radius}
          y={this.props.radius}
          strokeLinecap="round"
          fill="white"
        />
        <Circle
          r={this.props.radius - this.borderWidth}
          stroke={newColor}
          strokeWidth={this.borderWidth}
          strokeDasharray={[pathLength*levelProgress,pathLength]}
          rotate="-89.9"
          x={this.props.radius}
          y={this.props.radius}
          strokeLinecap="round"
          fill="rgba(0,0,0,0)"
        />
      </Svg>
    )
  }


  _getFactor(usage) {
    let level = this._getLevel(usage);
    let minW = this.energyLevels[level].min;
    let maxW = this.energyLevels[level].max;
    let val = (usage-minW) / (maxW-minW);

    if (val < 0.5) {
      return val - (0.2*val*val);
    }
    else if (val < 0.84) {
      return 0.61 + (0.9*val-0.6)
    }
    return 0.8*val*val + 0.2;
  }


  _getAlertIcon() {
    let alertSize = 34;
    return (
      <TouchableOpacity style={[styles.centered, {
        width:alertSize,
        height:alertSize, borderRadius:alertSize*0.5,
        borderWidth:3,
        borderColor:'#fff',
        position:'absolute',
        top:this.outerDiameter*0.06, left: this.outerDiameter*0.75, backgroundColor:colors.iosBlue.hex}]} onPress={() => { Actions.roomTraining_roomSize({sphereId: this.props.sphereId, locationId: this.props.locationId})}} >
        <Icon name="c1-locationPin1" color="#fff" size={17} style={{backgroundColor:'transparent'}} />
      </TouchableOpacity>
    )
  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let canDoLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
    let showFingerprintNeeded = false;
    if (this.props.locationId !== null && this.props.viewingRemotely !== true) {
      if (canDoLocalization === true && state.spheres[this.props.sphereId].locations[this.props.locationId].config.fingerprintRaw === null) {
        showFingerprintNeeded = true;
      }
    }
    this.renderState = store.getState();

    const animatedStyle = {
      transform: [
        { scale: this.props.scale },
      ]
    };

    return (
      <Animated.View style={[animatedStyle,{position:'absolute',  top: this.props.pos.y, left: this.props.pos.x, opacity: this.state.componentOpacity}]}>
        <View>
          {this.getCircle()}
          {this.props.locationId === null ? undefined : <PresentUsers sphereId={this.props.sphereId} locationId={this.props.locationId} store={store} roomRadius={this.props.radius} />}
          {showFingerprintNeeded === true ? this._getAlertIcon() : undefined}
        </View>
      </Animated.View>
    )
  }
}

export const RoomCircle = Animated.createAnimatedComponent(RoomCircleClass);

// ------------------------------------------------------------ //
// code for when there was an image behind the icon
// ------------------------------------------------------------ //
// if (this.props.backgroundImage) {
//   return (
//     <View style={{
//         width: outerDiameter,
//         height: outerDiameter,
//         backgroundColor:'transparent'
//       }}>
//       <View style={{
//         borderWidth:borderWidth,
//         borderColor:this.props.borderColor || '#ffffff',
//         borderRadius:outerDiameter,
//         width: outerDiameter,
//         height: outerDiameter,
//         backgroundColor:`rgb(${this.props.color.r},${this.props.color.g},${this.props.color.b})`
//       }}>
//         <Surface
//           width={innerDiameter}
//           height={innerDiameter}
//           backgroundColor='transparent'>
//           <CircleCrop>
//             <ImageHueBlend
//               r={this.props.color.r/255}
//               g={this.props.color.g/255}
//               b={this.props.color.b/255}
//               blendFactor={0.7}
//               image={this.props.backgroundImage}
//             />
//           </CircleCrop>
//         </Surface>
//       </View>
//       <View style={{
//         position:'relative',
//         top:-(1+offset)* outerDiameter,
//         left:0,
//         backgroundColor:'transparent',
//         width:outerDiameter,
//         height:outerDiameter,
//         alignItems:'center',
//         justifyContent:'center'
//         }}>
//         <Ionicon name={this.props.icon} size={iconSize} color='#ffffff' />
//       </View>
//       <View style={{
//         position:'relative',
//         top:-(1.4 + offset)*outerDiameter,
//         backgroundColor:'transparent',
//         width:outerDiameter,
//         height:(0.4+offset)*outerDiameter,
//         alignItems:'center',
//         justifyContent:'center'
//         }}>
//         <Text style={{color:'#ffffff', fontWeight:'bold',fontSize:iconSize/4}}>{this.props.content.value + ' ' + this.props.content.unit}</Text>
//       </View>
//     </View>
//   );
// }