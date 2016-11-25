import React, { Component } from 'react'
import {
  Animated,
  Image,
  View
} from 'react-native';

import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight} from '../../styles'


export class AnimatedBackground extends Component {
  constructor(props) {
    super();

    this.state = {viewOpacity: new Animated.Value(0), baseImage: props.image};
    this.animationStarted = false;
    this.animating = false;
  }

  startFade() {
    if (this.animationStarted === false) {
      let duration = 600;
      this.animationStarted = true;
      Animated.timing(this.state.viewOpacity, {toValue: 1, duration: duration}).start();

      setTimeout(() => {
        this.animating = false;
        this.animationStarted = false;
        this.setState({opacity: new Animated.Value(0), baseImage: this.props.image})
      }, duration)
    }
  }

  render() {
    if (this.state.baseImage !== this.props.image) {
      this.animating = true;
      setTimeout(() => {this.startFade()}, 0);
    }

    return (
      <View style={[styles.fullscreen,{elevation: 0}]}>
        <View style={styles.fullscreen}>
          {this.state.baseImage}
        </View>
        {this.animating ? <Animated.View style={[styles.fullscreen, {opacity:this.state.viewOpacity}]}>{this.props.image}</Animated.View> : undefined}


        <View style={styles.fullscreen} >
          {this.props.hideInterface !== true && this.props.hideTopBar !== true ? <View style={{width:screenWidth,height:topBarHeight}} /> : undefined}
          <View style={{flex:1}}>
            {this.props.children}
          </View>
          {this.props.hideInterface !== true && this.props.hideTabBar !== true ? <View style={{width: screenWidth,height:tabBarHeight}} /> : undefined}
        </View>
      </View>
    );
  }
}