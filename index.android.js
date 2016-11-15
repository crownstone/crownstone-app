'use strict';
import React, { Component } from 'react'
import {
  Animated,
  AppRegistry,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'
import { eventBus } from './js/util/eventBus'
import { colors, screenWidth, screenHeight } from './js/views/styles'

//import SplashScreen from "rn-splash-screen";

class Root extends Component {
  constructor() {
    super();
    this.state = {top: new Animated.Value(0)};
    this.unsubscribe = [];
  }

  // this is used to scroll the view up when typing is active
  componentDidMount() {
//    SplashScreen.hide();

    let snapBack = () => {
      Animated.timing(this.state.top, {toValue: 0, duration:0}).start();
    };

    this.unsubscribe.push(eventBus.on('focus', (posY) => {
      let keyboardHeight = 340;
      let distFromBottom = screenHeight - posY;
      Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration:200}).start()
    }));
    this.unsubscribe.push(eventBus.on('blur', () => {
      Animated.timing(this.state.top, {toValue: 0, duration:200}).start()
    }));

    // catch for the simulator
    this.unsubscribe.push(eventBus.on('showLoading', snapBack));
    this.unsubscribe.push(eventBus.on('showProgress', snapBack));
    this.unsubscribe.push(eventBus.on('hideLoading', snapBack));
    this.unsubscribe.push(eventBus.on('hideProgress', snapBack));

  }


  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  render() {
    return <View style={{flex:1, backgroundColor: colors.menuBackground.h}}>
      <Animated.View style={{flex:1, position:'relative', top: this.state.top}}>
        <AppRouter />
      </Animated.View>
    </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);