import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight} from '../../styles'


export class AnimatedBackground extends Component<any, any> {
  staticImage : any;
  animatedImage : any;
  value  : number = 0;

  constructor(props) {
    super(props);

    this.staticImage = props.image;
    this.animatedImage = props.image;
    this.state = {fade: new Animated.Value(0)};
  }

  componentWillReceiveProps(nextProps) {
    let change = false;
    if (this.value === 0) {
      if (nextProps.image !== this.staticImage) {
        change = true;
        this.animatedImage = nextProps.image;
      }
    }
    else {
      if (nextProps.image !== this.animatedImage) {
        change = true;
        this.staticImage = nextProps.image;
      }
    }

    if (change) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.fade, {toValue: newValue, duration: this.props.duration || 500}).start();
      this.value = newValue;
    }
  }

  render() {
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      height -= tabBarHeight;
    }

    return (
      <View style={[styles.fullscreen, {height:height}]}>
        <View style={[styles.fullscreen, {height:height}]}>
          {this.staticImage}
        </View>
        <Animated.View style={[styles.fullscreen, {height:height, opacity:this.state.fade}]}>{this.animatedImage}</Animated.View>
          <SafeAreaView style={{flex:1}}>
            {this.props.children}
          </SafeAreaView>
      </View>
    );
  }
}