'use strict';
import React, {
  AppRegistry,
  Component,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'

var SplashScreen = require('@remobile/react-native-splashscreen');

class Root extends Component {
  componentDidMount() {
    SplashScreen.hide();
  }

  render() {
    return <View style={{flex:1}}>
      <StatusBar barStyle="light-content" />
      <AppRouter />
    </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);