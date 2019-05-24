import * as React from 'react'; import { Component } from 'react';
import {screenWidth} from "../styles";
import FastImage from "react-native-fast-image";

export class BackgroundImage extends Component<{height?: number, image: any}, any> {
  render() {
    return (
      <FastImage
        source={this.props.image}
        style={{width: screenWidth, height: this.props.height}}
        resizeMode={FastImage.resizeMode.cover}
      />
    );
  }
}