'use strict';
import * as React from 'react'; import { Component } from 'react';
import { Animated,  StatusBar,  View, Platform } from 'react-native';

import { AppRouter } from './js/router/Router'
import { eventBus } from './js/util/EventBus'
import { BackgroundProcessHandler } from './js/backgroundProcesses/BackgroundProcessHandler'
import { colors, screenWidth, screenHeight, tabBarMargin, topBarMargin } from './js/views/styles'
import SplashScreen from 'react-native-splash-screen'
import { Sentry } from 'react-native-sentry';
import { config } from './sentrySettings';
import { USE_SENTRY } from './js/ExternalConfig'

if (USE_SENTRY) {
  if (Platform.OS === 'android') {
    Sentry.config(config.android).install();
  }
  else {
    Sentry.config(config.ios).install();
  }
}

export class Root extends Component {
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
    if (Platform.OS === 'ios') {
      SplashScreen.hide();

      this.focusTime = 0;

      let snapBack = () => { Animated.timing(this.state.top, {toValue: 0, duration:0}).start(); };
      let snapBackKeyboard = () => {
        if (new Date().valueOf() - this.focusTime > 100) {
          Animated.timing(this.state.top, {toValue: 0, duration: 200}).start();
        }
      };

      this.unsubscribe.push(eventBus.on('focus', (posY) => {
        let keyboardHeight = 360 + 80; // 80 is to correct of that stupid autofill bar that i cant turn off.
        let distFromBottom = screenHeight - (posY - this.state.top._value);
        this.focusTime = new Date().valueOf();
        Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration: 200}).start()
      }));
      this.unsubscribe.push(eventBus.on('hidePopup', snapBackKeyboard));
      this.unsubscribe.push(eventBus.on('showPopup', snapBackKeyboard));
      this.unsubscribe.push(eventBus.on('blur',      snapBackKeyboard));

      // catch for the simulator
      this.unsubscribe.push(eventBus.on('showLoading',  snapBack));
      this.unsubscribe.push(eventBus.on('showProgress', snapBack));
      this.unsubscribe.push(eventBus.on('hideLoading',  snapBack));
      this.unsubscribe.push(eventBus.on('hideProgress', snapBack));
    }
  }


  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => { callback() });
    this.unsubscribe = [];
  }


  render() {
    if (Platform.OS === 'ios') {
      return (
        <View style={{flex: 1, backgroundColor: colors.menuBackgroundDarker.hex}}>
          <View style={{flex: 1, marginBottom: tabBarMargin, marginTop: topBarMargin}}>
            <StatusBar barStyle="light-content"/>
            <Animated.View style={{flex: 1, position: 'relative', top: this.state.top}}>
              <AppRouter/>
            </Animated.View>
          </View>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1}}>
          <AppRouter />
        </View>
      )
    }
  };
}


