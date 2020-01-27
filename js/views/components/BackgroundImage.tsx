import * as React from 'react'; import { Component } from 'react';
import {screenWidth} from "../styles";
import { Image } from 'react-native'

export class BackgroundImage extends Component<{height?: number, image: any}, any> {
  render() {
    return (
      <Image
        source={this.props.image}
        style={{width: screenWidth, height: this.props.height}}
        resizeMode={'contain'}
      />
    );
  }
}