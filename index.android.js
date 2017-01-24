'use strict';
import React, { Component } from 'react'
import {
  Alert,
  AppRegistry,
  BackAndroid,
  Keyboard,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'
import { INITIALIZER } from './js/initialize'
import { colors, screenWidth, screenHeight } from './js/views/styles'



class Root extends Component {
  constructor() {
    super();
    this.unsubscribe = [];
  }

  // this is used to scroll the view up when typing is active
  componentDidMount() {
    // start the BLE things.
    INITIALIZER.init();
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  render() {
    StatusBar.setBackgroundColor(colors.menuBackgroundDarker.hex, true);
    return (
      <View style={{flex:1}}>
        <AppRouter />
      </View>
    )
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);