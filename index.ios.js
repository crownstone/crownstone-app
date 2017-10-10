'use strict';
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  AppRegistry,
  Keyboard,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'
import { eventBus } from './js/util/EventBus'
import { BackgroundProcessHandler } from './js/backgroundProcesses/BackgroundProcessHandler'
import { colors, screenWidth, screenHeight } from './js/views/styles'
import SplashScreen from "rn-splash-screen";

import { config } from './sentrySettings'
import { Sentry } from 'react-native-sentry';


if ( global.__DEV__ !== true) {
  if (config.ios) {
    Sentry.config(config.ios).install();
  }
}


class Root extends Component {

  constructor() {
    super();
    this.state = {top: new Animated.Value(0)};
    this.unsubscribe = [];
  }

  componentWillMount() {
    BackgroundProcessHandler.start();
  }

  // this is used to scroll the view up when typing is active
  componentDidMount() {
    SplashScreen.hide();

    this.snapBackKeyboardTimeout = 0;
    this.focusTime = 0;

    let snapBack = () => { Animated.timing(this.state.top, {toValue: 0, duration:0}).start(); };
    let snapBackKeyboard = () => {
      if (new Date().valueOf() - this.focusTime > 100) {
        Animated.timing(this.state.top, {toValue: 0, duration: 200}).start();
      }
    };

    this.unsubscribe.push(eventBus.on('focus', (posY) => {
      let keyboardHeight = 360;
      let distFromBottom = screenHeight - (posY - this.state.top._value);
      this.focusTime = new Date().valueOf();
      Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration: 200}).start()
    }));
    this.unsubscribe.push(eventBus.on('hidePopup', snapBackKeyboard));
    this.unsubscribe.push(eventBus.on('showPopup', snapBackKeyboard));
    this.unsubscribe.push(eventBus.on('blur', snapBackKeyboard));

    // catch for the simulator
    this.unsubscribe.push(eventBus.on('showLoading',  snapBack));
    this.unsubscribe.push(eventBus.on('showProgress', snapBack));
    this.unsubscribe.push(eventBus.on('hideLoading',  snapBack));
    this.unsubscribe.push(eventBus.on('hideProgress', snapBack));
  }


  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  render() {
    return <View style={{flex:1}}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={{flex:1, position:'relative', top: this.state.top}}>
        <AppRouter />
      </Animated.View>
    </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);