import React, { Component } from 'react'
import {

  Dimensions,
  Image,
  PixelRatio,
  Text,
  View,
} from 'react-native';

import { AnimatedLogo }       from './animated/AnimatedLogo'
import { AnimatedLoadingBar } from './animated/AnimatedLoadingBar'
import { FadeInView }         from './animated/FadeInView'
import { styles, colors , screenHeight, screenWidth } from './../styles'
import { eventBus } from '../../util/eventBus'

export class BleStateOverlay extends Component {
  constructor() {
    super();

    this.state = {
      visible: false,
    };
    this.unsubscribe = [];
    this.children = undefined;
  }

  componentDidMount() {

  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(0,0,0,0.75)',justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.state.visible}>
        {this.children}
      </FadeInView>
    );
  }
}