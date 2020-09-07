
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
  value : number;

  constructor(props) {
    super(props);
    this.color1 = props.color;
    this.color2 = props.color;
    this.state = {colorPhase: new Animated.Value(0)};
    this.value = 0;
  }

  shouldComponentUpdate(nextProps) {
    let change = false;
    if (this.value === 0) {
      if (nextProps.color !== this.color1) {
        change = true;
        this.color2 = nextProps.color;
      }
    }
    else {
      if (nextProps.color !== this.color2) {
        change = true;
        this.color1 = nextProps.color;
      }
    }

    if (change) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.colorPhase, {toValue: newValue, duration: this.props.duration || 300}).start();
      this.value = newValue;
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
        width:size,
        height:size,
        borderRadius:0.5*size,
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