import * as React from 'react'; import { Component } from 'react';
import {
  View
} from "react-native";

import {styles} from '../styles'


export class Circle extends Component<{color: string, borderWidth?: number, borderColor?: string, size: number, style?: any}, any> {
  render() {
    let size = this.props.size;
    return (
      <View style={[{
        width:size,
        height:size,
        borderRadius:0.5*size,
        backgroundColor: this.props.color,
        borderWidth: this.props.borderWidth,
        borderColor: this.props.borderColor
      }, styles.centered, this.props.style]}>
    {this.props.children}
    </View>
  )
  }
}