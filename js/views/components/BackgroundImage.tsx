import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
} from 'react-native';
import {screenHeight, screenWidth, tabBarHeight, topBarHeight} from "../styles";

export class BackgroundImage extends Component<{height?: boolean, image: any}, any> {
  render() {
    return (
      <Image source={this.props.image} style={{width: screenWidth, height: this.props.height, resizeMode:'cover'}} />
    );
  }
}