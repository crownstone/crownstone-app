import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PixelRatio,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FinalizeLocalizationIcon } from '../components/FinalizeLocalizationIcon'
import { Icon }                     from '../components/Icon'
import { FadeInView }               from '../components/animated/FadeInView'
import { styles, colors, screenHeight, screenWidth } from '../styles'
import { eventBus } from '../../util/EventBus'

import Svg,{
  Circle,
  LinearGradient,
  Rect,
  Defs,
  Stop
} from 'react-native-svg';


export class LocalizationSetupStep1 extends Component<any, any> {
  csSize : number;
  w : number;
  h : number;
  fadeInDuration : number;
  targets : any;
  targets2 : any;
  unsubscribe : any;
  children : any;
  cleanup : any;
  cleanup_circle1 : any;

  constructor(props) {
    super(props);

    this.csSize = 0.2*screenWidth;

    this.w = screenWidth;
    this.h = screenHeight;
    this.fadeInDuration = 200;
    
    this.state = {
      innerCirclesAmount: 0.0,
      outerCircleAmount: 0.0,
      visible: false,
      bigHouseSize: 0.35*screenWidth,
      homeOpacity: new Animated.Value(0),
      smallHomeOpacity: new Animated.Value(0),
      textOpacity: new Animated.Value(0),
      c1_left: new Animated.Value(-0.5*screenWidth),
      c1_top: new Animated.Value(0),
      c1_opacity: new Animated.Value(0),
      c2_left: new Animated.Value(1.5*screenWidth),
      c2_top: new Animated.Value(0),
      c2_opacity: new Animated.Value(0),
      c3_left: new Animated.Value(-0.5*screenWidth),
      c3_top: new Animated.Value(screenHeight),
      c3_opacity: new Animated.Value(0),
      c4_left: new Animated.Value(1.5*screenWidth),
      c4_top: new Animated.Value(screenHeight),
      c4_opacity: new Animated.Value(0),
    };


    let xf = 0.5;
    let yf = 0.3;
    this.targets = {
      c1_left: 0.5*this.w - xf*this.csSize,
      c1_top:  (0.5*this.h - 0.45*this.w) - yf*this.csSize,
      c2_left: 0.85*this.w - xf*this.csSize,
      c2_top: 0.5*this.h - yf*this.csSize,
      c3_left: 0.15*this.w - xf*this.csSize,
      c3_top: 0.5*this.h - yf*this.csSize,
      c4_left: 0.5*this.w - xf*this.csSize,
      c4_top: (0.5*this.h + 0.45*this.w) - yf*this.csSize,
    };

    this.targets2 = {
      c1_left: 0.2*this.w - 1.5*xf*this.csSize,
      c1_top:  0.13*this.h - yf*this.csSize,
      c2_left: 0.4*this.w - 1.25*xf*this.csSize,
      c2_top: 0.23*this.h - yf*this.csSize,
      c3_left: 0.6*this.w - 0.75*xf*this.csSize,
      c3_top: 0.23*this.h - yf*this.csSize,
      c4_left: 0.8*this.w - 0.5*xf*this.csSize,
      c4_top: 0.13*this.h - yf*this.csSize,
    };

    this.unsubscribe = [];
    this.children = undefined;
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showLocalizationSetupStep1", () => {
      // we reset the entire state because we might show this video twice.
      this.setState({
        innerCirclesAmount: 0.0,
        outerCircleAmount: 0.0,
        visible: true,
        bigHouseSize: 0.35*screenWidth,
        homeOpacity: new Animated.Value(0),
        smallHomeOpacity: new Animated.Value(0),
        textOpacity: new Animated.Value(0),
        c1_left: new Animated.Value(-0.5*screenWidth),
        c1_top: new Animated.Value(0),
        c1_opacity: new Animated.Value(0),
        c2_left: new Animated.Value(1.5*screenWidth),
        c2_top: new Animated.Value(0),
        c2_opacity: new Animated.Value(0),
        c3_left: new Animated.Value(-0.5*screenWidth),
        c3_top: new Animated.Value(screenHeight),
        c3_opacity: new Animated.Value(0),
        c4_left: new Animated.Value(1.5*screenWidth),
        c4_top: new Animated.Value(screenHeight),
        c4_opacity: new Animated.Value(0),
      });
      setTimeout(() => {
        this._startAnimation();
      }, this.fadeInDuration + 50)
    }));

    if (this.state.visible === true) {
      this._startAnimation();
    }
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _startAnimation() {
    let duration = 400;
    this.cleanup = setInterval(() => {
      if (this.state.bigHouseSize > 0.45*this.w) {
        clearInterval(this.cleanup);
      }

      this.setState({bigHouseSize: this.state.bigHouseSize + 0.01*this.w})
    });
    let animations = [];
    animations.push(Animated.timing(this.state.homeOpacity, {toValue: 1, duration: 4*duration}));
    let c1 = [
      Animated.timing(this.state.c1_left,    {toValue: this.targets.c1_left, duration: duration}),
      Animated.timing(this.state.c1_top,     {toValue: this.targets.c1_top, duration: duration}),
      Animated.timing(this.state.c1_opacity, {toValue: 1, duration: duration})
    ];
    let c2 = [
      Animated.timing(this.state.c2_left,    {toValue: this.targets.c2_left, duration: duration}),
      Animated.timing(this.state.c2_top,     {toValue: this.targets.c2_top, duration: duration}),
      Animated.timing(this.state.c2_opacity, {toValue: 1, duration: duration}),
    ];
    let c3 = [
      Animated.timing(this.state.c3_left,    {toValue: this.targets.c3_left, duration: duration}),
      Animated.timing(this.state.c3_top,     {toValue: this.targets.c3_top, duration: duration}),
      Animated.timing(this.state.c3_opacity, {toValue: 1, duration: duration}),
    ];
    let c4 = [
      Animated.timing(this.state.c4_left,    {toValue: this.targets.c4_left, duration: duration}),
      Animated.timing(this.state.c4_top,     {toValue: this.targets.c4_top, duration: duration}),
      Animated.timing(this.state.c4_opacity, {toValue: 1, duration: duration}),
    ];

    animations.push(Animated.parallel(c1));
    animations.push(Animated.parallel(c2));
    animations.push(Animated.parallel(c3));
    animations.push(Animated.parallel(c4));

    Animated.sequence(animations).start();

    setTimeout(() => {
      let innerCircleFinished = false;
      this.cleanup_circle1 = setInterval(() => {
        if (this.state.outerCircleAmount >= 1.8) {
          clearInterval(this.cleanup_circle1);
          this.setState({outerCircleAmount: 0, innerCirclesAmount: 0});
          let animations2 = [];
          let c1 = [
            Animated.timing(this.state.c1_left,    {toValue: this.targets2.c1_left, duration: 1.25*duration}),
            Animated.timing(this.state.c1_top,     {toValue: this.targets2.c1_top,  duration: 1.25*duration}),
          ];
          let c2 = [
            Animated.timing(this.state.c2_left,    {toValue: this.targets2.c2_left, duration: duration}),
            Animated.timing(this.state.c2_top,     {toValue: this.targets2.c2_top,  duration: duration}),
            Animated.timing(this.state.homeOpacity, {toValue: 0, duration: duration}),
            Animated.timing(this.state.smallHomeOpacity, {toValue: 1, duration: 0.5*duration}),
          ];
          let c3 = [
            Animated.timing(this.state.c3_left,    {toValue: this.targets2.c3_left, duration: 0.75*duration}),
            Animated.timing(this.state.c3_top,     {toValue: this.targets2.c3_top,  duration: 0.75*duration}),
          ];
          let c4 = [
            Animated.timing(this.state.c4_left,    {toValue: this.targets2.c4_left, duration: 0.5*duration}),
            Animated.timing(this.state.c4_top,     {toValue: this.targets2.c4_top,  duration: 0.5*duration}),
          ];

          animations2.push(Animated.parallel(c1));
          animations2.push(Animated.parallel(c2));
          animations2.push(Animated.parallel(c3));
          animations2.push(Animated.parallel(c4));
          animations2.push(Animated.timing(this.state.textOpacity, {toValue: 1, duration: 0.75*duration}));

          Animated.sequence(animations2).start();
        }
        else {
          let newState = {innerCirclesAmount: this.state.innerCirclesAmount, outerCircleAmount: this.state.outerCircleAmount};
          if (this.state.innerCirclesAmount < 1 && innerCircleFinished === false)
            newState.innerCirclesAmount += 0.01;
          else if (this.state.outerCircleAmount >= 1.75) {
            innerCircleFinished = true;
            newState.innerCirclesAmount = 0;
          }
          if (this.state.innerCirclesAmount > 0.05 || innerCircleFinished === true)
            newState.outerCircleAmount += 0.005 + 0.02 * newState.outerCircleAmount;
          this.setState(newState);
        }
      })
    },8*duration);
  }

  _getContent() {
    if (this.state.visible === false)
      return undefined;


    let dx = 0.52*this.csSize;
    let dy = 0.35*this.csSize;
    let r1 = 0.45*this.csSize + (1+this.state.innerCirclesAmount)*0.15*this.csSize;
    let r2 = this.w*0.6 + (1+this.state.outerCircleAmount)*20;
    let pathLength = Math.PI * 2 * r1;

    let innerCircleOpacity = Math.min(1,5*(1-this.state.innerCirclesAmount));
    let outerCircleOpacity = Math.min(1,4*(1.8-this.state.outerCircleAmount));

    let stroke1 = pathLength*this.state.innerCirclesAmount;
    let stroke2 = (0.25*pathLength + pathLength*0.25*this.state.innerCirclesAmount);

    let gradientColor1 = colors.green.hex;
    let gradientColor2 = "#63a14e";
    let contentColor = "#fff";

    return (
      <View style={{position:'absolute', top:0, backgroundColor: contentColor, width: this.w, height: this.h, borderRadius: 0, padding: 0}}>
        <Svg width={this.w} height={this.h}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2={this.w} y2={this.h}>
              <Stop offset="0" stopColor={gradientColor1} stopOpacity="1" />
              <Stop offset="1" stopColor={gradientColor2} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width={this.w}  height={this.h} fill="url(#grad)" />
          <Circle
            r={r1}
            strokeOpacity={innerCircleOpacity}
            stroke={this.state.innerCirclesAmount === 0 ? 'transparent' : contentColor}
            strokeWidth={3}
            strokeDasharray={[stroke1, stroke2]}
            x={this.targets.c1_left + dx}
            y={this.targets.c1_top  + dy}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            r={r1}
            strokeOpacity={innerCircleOpacity}
            stroke={this.state.innerCirclesAmount === 0 ? 'transparent' : contentColor}
            strokeWidth={3}
            strokeDasharray={[stroke1, stroke2]}
            x={this.targets.c2_left + dx}
            y={this.targets.c2_top  + dy}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            r={r1}
            strokeOpacity={innerCircleOpacity}
            stroke={this.state.innerCirclesAmount === 0 ? 'transparent' : contentColor}
            strokeWidth={3}
            strokeDasharray={[stroke1, stroke2]}
            x={this.targets.c3_left + dx}
            y={this.targets.c3_top  + dy}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            r={r1}
            strokeOpacity={innerCircleOpacity}
            stroke={this.state.innerCirclesAmount === 0 ? 'transparent' : contentColor}
            strokeWidth={3}
            strokeDasharray={[stroke1, stroke2]}
            x={this.targets.c4_left + dx}
            y={this.targets.c4_top  + dy}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            r={r2}
            stroke={this.state.outerCircleAmount === 0 ? 'transparent' : contentColor}
            strokeWidth={5}
            strokeOpacity={outerCircleOpacity}
            strokeDasharray={[pathLength*this.state.outerCircleAmount,pathLength*0.6]}
            x={this.w*0.5}
            y={this.h*0.5}
            strokeLinecap="round"
            fill="transparent"
          />
        </Svg>
        <Animated.View style={{position:'absolute',top: 0.13*this.h - 1.2*this.csSize, width:this.w, height:this.state.bigHouseSize, opacity: this.state.smallHomeOpacity, alignItems:'center', justifyContent:'center'}}>
          <Icon name="ios-home" size={1.2*this.csSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>
        <Animated.View style={{position:'absolute',top: 0.5*this.h - 0.5*this.state.bigHouseSize, width:this.w, height:this.state.bigHouseSize, opacity: this.state.homeOpacity, alignItems:'center', justifyContent:'center'}}>
          <Icon name="ios-home" size={this.state.bigHouseSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>
        <Animated.View style={{position:'absolute',top: this.state.c1_top, left:this.state.c1_left, opacity: this.state.c1_opacity,}}>
          <Icon name="c2-crownstone" size={this.csSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>
        <Animated.View style={{position:'absolute',top: this.state.c2_top, left:this.state.c2_left, opacity: this.state.c2_opacity}}>
          <Icon name="c2-crownstone" size={this.csSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>
        <Animated.View style={{position:'absolute',top: this.state.c3_top, left:this.state.c3_left, opacity: this.state.c3_opacity}}>
          <Icon name="c2-crownstone" size={this.csSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>
        <Animated.View style={{position:'absolute',top: this.state.c4_top, left:this.state.c4_left, opacity: this.state.c4_opacity}}>
          <Icon name="c2-crownstone" size={this.csSize} color={contentColor} style={{backgroundColor:'transparent'}} />
        </Animated.View>

        <Animated.View style={{position:'absolute',top: 0.24*this.h, opacity: this.state.textOpacity, width:this.w, height: this.h - 0.24*this.h, justifyContent:'center', alignItems:'center', padding:10}}>
          <View style={{flex:1}} />
          <Text style={{fontSize: 0.1*this.w, color: contentColor, fontWeight:'800', paddingBottom:0.04*this.h, textAlign:'center', backgroundColor:'transparent'}}>Congratulations!</Text>
          <Text style={{fontSize: 16, color: contentColor, textAlign:'center', backgroundColor:'transparent'}}>You have added 4 Crownstones to your Sphere! We can now use the indoor localization at room level!</Text>
          <View style={{flex:1}} />
          <Text style={{fontSize: 16, color: contentColor, textAlign:'center', backgroundColor:'transparent'}}>{"We've added this button to your overview:"}</Text>
            <View style={{flex:1}} />
            <FinalizeLocalizationIcon />
            <View style={{flex:1}} />
            <Text style={{fontSize: 16, color: contentColor, textAlign:'center', backgroundColor:'transparent'}}>{"Once you've added all your Crownstones, tap that button to start teaching Crownstone about your home!"}</Text>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => {this.setState({visible: false});}} style={{borderWidth:2, borderRadius:0.04*this.h, borderColor: contentColor, width:0.3*this.w, height:0.08*this.h, justifyContent:'center', alignItems:'center'}}>
                <Text style={{fontSize: 20, fontWeight:'800', color: contentColor, textAlign:'center', backgroundColor:'transparent'}}>OK!</Text>
              </TouchableOpacity>
              <View style={{flex:1}} />
        </Animated.View>
      </View>
    )
  }


  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba('+ colors.menuBackground.rgb.r + ',' + colors.menuBackground.rgb.g + ',' + colors.menuBackground.rgb.b + ',' + '0.6)',justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={this.fadeInDuration}
        visible={this.state.visible}>
        {this._getContent()}
      </FadeInView>
    );
  }
}