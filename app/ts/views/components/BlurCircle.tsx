import * as React from 'react'; import { Component } from 'react';

import {styles} from '../styles'
import {Blur} from "./Blur";


export class BlurCircle extends Component<{color: string, borderWidth?: number, borderColor?: string, size: number, style?: any}, any> {
  render() {
    let size = this.props.size;
    return (
      <Blur
        blurAmount={5}
        blurType={'light'}
        style={[{
        width:size,
        height:size,
        borderRadius:0.5*size,
        backgroundColor: this.props.color,
      }, styles.centered, this.props.style]}
      >
        {this.props.children}
      </Blur>
    );
  }
}