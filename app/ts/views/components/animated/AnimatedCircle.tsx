
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated, View
} from "react-native";

import {styles} from '../../styles'


export class AnimatedCircle extends Component<any, any> {
  color1 : string;
  color2 : string;
  size  : number;
  value : number;

  constructor(props) {
    super(props);
    this.color1 = props.color;
    this.color2 = props.color;
    this.state = {colorPhase: new Animated.Value(0), size: new Animated.Value(this.props.size)};
    this.value = 0;
    this.size = this.props.size;
  }

  shouldComponentUpdate(nextProps) {
    let changeColor = false;
    let changeSize = false;
    if (this.value === 0) {
      if (nextProps.color !== this.color1) {
        changeColor = true;
        this.color2 = nextProps.color;
      }
    }
    else {
      if (nextProps.color !== this.color2) {
        changeColor = true;
        this.color1 = nextProps.color;
      }
    }

    if (changeColor) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.colorPhase, {toValue: newValue, useNativeDriver: false, duration: this.props.duration || 300, delay: this.props.delay}).start();
      this.value = newValue;
    }

    if (nextProps.size !== this.size) {
      changeSize = true;
      this.size = nextProps.size;
      if (this.props.spring === false) {
        Animated.timing(this.state.size, {toValue: this.size, useNativeDriver: false, delay: this.props.delay}).start();
      }
      else {
        Animated.spring(this.state.size, {toValue: this.size, friction: 2, useNativeDriver: false, delay: this.props.delay}).start()
      }
    }
    return true;
  }

  render() {
    let backgroundColor = this.state.colorPhase.interpolate({
      inputRange: [0,1],
      outputRange: [this.color1,  this.color2]
    });
    let size = this.props.size;
    let content = (
      <Animated.View style={[{
        width:        this.state.size,
        height:       this.state.size,
        borderRadius: this.state.size,
        backgroundColor: backgroundColor,
        borderWidth: this.props.borderWidth,
        borderColor: this.props.borderColor
      }, styles.centered, this.props.style]}>
        {this.props.children}
      </Animated.View>
    );

    if (this.props.borderSize) {
      let outerSize = size+2*this.props.borderSize;
      return (
        <View style={{width: outerSize, height: outerSize, borderRadius: 0.5*outerSize, backgroundColor: this.props.borderColor, alignItems:"center", justifyContent:"center"}}>
          { content }
        </View>
      )
    }
    return content;
  }
}
