'use strict';
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  AppRegistry,
  BackAndroid,
  Keyboard,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'
import { BackgroundProcessHandler } from './js/backgroundProcesses/BackgroundProcessHandler'
import { colors, screenWidth, screenHeight } from './js/views/styles'
import SplashScreen from 'react-native-splash-screen'

import { config } from './sentrySettings'
import { Sentry } from 'react-native-sentry';

if ( global.__DEV__ !== true) {
  if (config.android) {
    Sentry.config(config.ios).install();
  }
}

class Root extends Component {
  componentWillMount() {
    BackgroundProcessHandler.start();
  }

  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    // StatusBar.setBackgroundColor(colors.menuBackgroundDarker.hex, true);
    return (
      <View style={{flex:1}}>
        <AppRouter />
      </View>
    )
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);