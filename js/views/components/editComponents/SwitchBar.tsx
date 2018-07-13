import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Switch,
  TouchableOpacity,
  Platform,
  Text,
  View
} from 'react-native';

import {styles, colors, screenWidth, LARGE_ROW_SIZE, NORMAL_ROW_SIZE} from '../../styles'

export class SwitchBar extends Component<any, any> {
  animationAllowed;
  constructor(props) {
    super(props);

    this.state = {experimental: props.experimental, leftPos: new Animated.Value(0), opacity: new Animated.Value(props.experimental ? 1 : 0)};
    this.animationAllowed = true;

    if (props.experimental) {
      this.loop();
    }

  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.experimental !== this.props.experimental) {
      if (this.props.experimental === true) {
        Animated.timing(this.state.opacity, {toValue: 1, duration: 200}).start();
        this.loop()
      }
      else {
        this.state.opacity.setValue(0);
        this.cancelLoop();
      }
    }
  }

  componentWillUnmount() {
    this.cancelLoop();
  }

  cancelLoop() {
    this.animationAllowed = false;
    this.state.leftPos.stopAnimation();
  }

  loop() {
    this.animationAllowed = true;
    let duration = 20000;
    Animated.timing(this.state.leftPos, {toValue: screenWidth - 540 - 50, duration: duration}).start(() => {
      if (this.animationAllowed) {
        Animated.timing(this.state.leftPos, {toValue: 20, duration: duration}).start(() => {
          if (this.animationAllowed) {
            this.loop()
          }
        })
      }
    })
  }

  _getButton(navBarHeight, fontColor) {
    let style = [styles.listView, {height: navBarHeight}, this.props.wrapperStyle];
    let helpColor = colors.black.rgba(0.5);
    if (this.props.experimental) {
      style =  [styles.listView,{position:'absolute', top:0, left:0, overflow:'hidden', height: navBarHeight, width: screenWidth, backgroundColor:"transparent"}];
      helpColor = colors.white.hex;
    }

    return (
      <View style={style}>
        {this.props.icon !== undefined ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]}>{this.props.icon}</View> : undefined}
        {this.props.iconIndent === true ? <View style={[styles.centered, {width:0.12 * screenWidth, paddingRight:15}]} /> : undefined }
        <Animated.Text style={[styles.listTextLarge, this.props.style, {color: fontColor}]}>{this.props.label}</Animated.Text>
        <View style={{flex:1}} />
        {
          this.props.hasHelp ? <TouchableOpacity onPress={() => {this.props.onHelp(); }} style={{borderColor: helpColor, borderWidth: 1, width:30, height:30, borderRadius:15, alignItems:'center', justifyContent:'center'}}>
                                <Text style={{color: helpColor, fontSize: 20, fontWeight:'300'}}>?</Text>
                               </TouchableOpacity>
                             : undefined
        }
        { this.props.hasHelp ? <View style={{flex:0.75}} /> : undefined }
        <Switch
          disabled={this.props.disabled || false}
          value={this.props.value}
          onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
        />
      </View>
    )
  }

  render() {
    let navBarHeight = this.props.barHeight || NORMAL_ROW_SIZE;
    if (this.props.largeIcon)
      navBarHeight = LARGE_ROW_SIZE;
    else if (this.props.icon)
      navBarHeight = NORMAL_ROW_SIZE;


    if (this.props.experimental) {
      let fontColor = this.state.opacity.interpolate({
        inputRange: [0,1],
        outputRange: [colors.black.hex,  colors.white.hex]
      });

      return (
        <View style={{height: navBarHeight , width: screenWidth, backgroundColor: colors.menuBackground.hex}}>
          <Animated.View style={{position:'absolute', top:0, left:0, overflow:'hidden', height: navBarHeight, width: screenWidth, opacity: this.state.opacity}}>
            <Animated.View style={{position:'absolute', top: Platform.OS === 'android' ? -24 : -17, left: this.state.leftPos}}>
              <Text style={{color:colors.white.rgba(0.1), fontSize:70, fontWeight:'900', fontStyle:'italic', width: 540}}>{this.props.experimentalLabel || 'EXPERIMENTAL'}</Text>
            </Animated.View>
          </Animated.View>
          { this._getButton(navBarHeight, fontColor) }
        </View>
      )
    }
    else {
      return this._getButton(navBarHeight, undefined);
    }
  }
}
