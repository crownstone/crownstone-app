
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BorderCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';


import { colors } from '../styles'

export class BorderCircle extends Component<any, any> {
  render() {
    let size = this.props.size || 60;
    let borderWidth = this.props.borderWidth || 2;
    let borderColor = this.props.borderColor || colors.white.hex;
    let bodyColor = this.props.color || colors.csBlue.hex;
    let innerSize = size - 2*borderWidth;
    return (
      <View style={[
        {
          width: size, height: size, borderRadius: 0.5*size,
          alignItems:'center', justifyContent:'center', backgroundColor: borderColor
        },
        this.props.style
      ]}>
        <View style={{width: innerSize, height: innerSize, borderRadius: 0.5*innerSize, alignItems:'center', justifyContent:'center', backgroundColor: bodyColor}}>
          { this.props.children }
        </View>
      </View>
    )
  }
}
