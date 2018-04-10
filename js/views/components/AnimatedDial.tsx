import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import { styles, colors, screenWidth, screenHeight, availableScreenHeight, topBarHeight, statusBarHeight} from '../styles'
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Mixer } from "../../util/colorCharm/Mixer";

export class AnimatedDial extends Component<{width: number, height: number, index?: number, level: any, blink: any}, any> {
  amountOfBlocks = 20;
  range = 1;
  spacing = 0.008;
  step = (this.range - this.spacing) / this.amountOfBlocks;
  blockSize = (this.range - (this.amountOfBlocks+1)*this.spacing) / this.amountOfBlocks;
  centerBlockWidth = 5;

  radius;
  animationTimeout1;
  animationTimeout2;
  animationTimeout3;
  animationTimeout4;
  animationTimeout5;
  animationTimeout6;

  constructor(props) {
    super(props);
    this.radius = (props.width * 0.5) - 15;
    this.state = {level: props.level, instant: false}
  }


  componentWillReceiveProps(props) {
    if (props.level !== this.state.level) {
      this.setState({level: props.level, instant: false}, () => {
        if (this.state.level === 1) {
          let delayCount = 0;
          this.animationTimeout1 = setTimeout(() => { this.setState({level:0, instant:true})}, 400 + (delayCount++)*200);
          this.animationTimeout2 = setTimeout(() => { this.setState({level:1, instant:true})}, 400 + (delayCount++)*200);
          this.animationTimeout3 = setTimeout(() => { this.setState({level:0, instant:true})}, 400 + (delayCount++)*200);
          this.animationTimeout4 = setTimeout(() => { this.setState({level:1, instant:true})}, 400 + (delayCount++)*200);
          this.animationTimeout5 = setTimeout(() => { this.setState({level:0, instant:true})}, 400 + (delayCount++)*200);
          this.animationTimeout6 = setTimeout(() => { this.setState({level:1, instant:true})}, 400 + (delayCount++)*200);
        }
      })
    }
  }

  componentWillUnmount() {
    clearTimeout(this.animationTimeout1);
    clearTimeout(this.animationTimeout2);
    clearTimeout(this.animationTimeout3);
    clearTimeout(this.animationTimeout4);
    clearTimeout(this.animationTimeout5);
    clearTimeout(this.animationTimeout6);
  }

  _getStaticBlocks() {
    let blocks = [];

    let radius = this.radius - 0.5*this.centerBlockWidth;
    let pathLength = Math.PI * 2 * radius;

    for (let i = 0; i < this.amountOfBlocks; i++) {
      blocks.push(
        <Circle
          key={"StaticBlock_" + i}
          r={radius}
          stroke={colors.white.rgba(0.3)}
          strokeWidth={this.centerBlockWidth}
          strokeDasharray={[this.blockSize*pathLength, pathLength]}
          rotation={-90 + i*((360/(1-this.spacing))*this.step)}
          x={this.props.width * 0.5}
          y={this.props.height * 0.5}
          fillOpacity={0}
        />
      )
    }

    return blocks;
  }

  _getBlocks(stop = this.amountOfBlocks) {
    let radius = this.radius - 0.5*this.centerBlockWidth;
    let blocks = [];

    for (let i = 0; i < this.amountOfBlocks; i++) {
      let visible = true;
      if (i >= stop) {
        visible = false;
      }
      blocks.push(
        <AnimatedBlock
          key={"AnimatedBlock_" + i}
          radius={radius}
          instant={this.state.instant}
          animationSpeed={this.state.instant ? 100 : 300}
          color={colors.white}
          subColor={colors.green}
          blockSize={this.blockSize}
          centerBlockWidth={this.centerBlockWidth}
          index={i}
          stopIndex={Math.ceil(stop)}
          visible={visible}
          angle={-90 + i*((360/(1-this.spacing))*this.step)}
          width={this.props.width}
          height={this.props.height}
        />
      )
    }

    return blocks;
  }

  render() {
    return (
      <View style={{position: 'absolute', top:0, left:0, width: this.props.width, height: this.props.height}}>
      <Svg
        width={this.props.width}
        height={this.props.height}
      >
        {this._getStaticBlocks()}
      </Svg>
      {this._getBlocks(this.state.level * this.amountOfBlocks) }
    </View>
    )
  }
}


class AnimatedBlock extends Component<{
  visible: boolean,
  color: any,
  subColor: any,
  instant: boolean,
  animationSpeed: number,
  width: number,
  height: number,
  angle: number,
  blockSize: number,
  centerBlockWidth: number,
  radius: number
  index: number,
  stopIndex: number
}, any> {

  visible : boolean;
  previousStopIndex: number = 0;

  constructor(props) {
    super(props);

    this.state = {opacity: new Animated.Value(props.visible ? 1 : 0) };
    this.visible = props.visible;
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextProps.visible !== this.visible) {
      let previousStopIndex = this.previousStopIndex;

      let distance = Math.abs(previousStopIndex - this.props.index );
      let delay = 20 * distance;

      if (nextProps.instant) {
        delay = 0;
      }

      this.visible = nextProps.visible;
      this.previousStopIndex = nextProps.stopIndex;

      Animated.timing(this.state.opacity, {toValue: nextProps.visible ? 1 : 0, delay: delay, duration: nextProps.animationSpeed}).start()
    }
  }

  componentWillUnmount() {

  }

  render() {
    let radius = this.props.radius;
    let pathLength = 2 * Math.PI * (radius);

    let radius2 = this.props.radius - this.props.centerBlockWidth - 2;
    let pathLength2 = 2 * Math.PI * (radius2);

    let radius3 = this.props.radius - this.props.centerBlockWidth - 2 - this.props.centerBlockWidth * 0.8 - 2;
    let pathLength3 = 2 * Math.PI * (radius3);


    return (
      <Animated.View style={{
        width:  this.props.width,
        height: this.props.height,
        position:'absolute',
        top:  0,
        left: 0,
        opacity: this.state.opacity
      }}>
        <Svg width={this.props.width} height={this.props.height}>
          <Circle
            r={radius}
            stroke={this.props.color.hex}
            strokeWidth={this.props.centerBlockWidth}
            strokeDasharray={[this.props.blockSize*pathLength, pathLength]}
            rotation={this.props.angle}
            x={this.props.width * 0.5}
            y={this.props.height * 0.5}
            fillOpacity={0}
          />
          <Circle
            r={radius2}
            stroke={this.props.color.rgba(0.5)}
            strokeWidth={this.props.centerBlockWidth * 0.8}
            strokeDasharray={[this.props.blockSize*pathLength2, pathLength2]}
            rotation={this.props.angle}
            x={this.props.width * 0.5}
            y={this.props.height * 0.5}
            fillOpacity={0}
          />
          <Circle
            r={radius3}
            stroke={ this.props.subColor.hex }
            strokeWidth={this.props.centerBlockWidth * 0.4}
            strokeDasharray={[this.props.blockSize*pathLength3, pathLength3]}
            rotation={this.props.angle}
            x={this.props.width * 0.5}
            y={this.props.height * 0.5}
            fillOpacity={0}
          />
        </Svg>
      </Animated.View>
    )
  }
}
