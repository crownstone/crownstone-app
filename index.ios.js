'use strict';
import React, {
  Animated,
  AppRegistry,
  Component,
  StatusBar,
  View
} from 'react-native';

import { AppRouter } from './js/router/Router'
import { eventBus } from './js/util/eventBus'
import { colors, height } from './js/views/styles'

var SplashScreen = require('@remobile/react-native-splashscreen');

class Root extends Component {
  constructor() {
    super();
    this.state = {top: new Animated.Value(0)};
    this.unsubscribe = [];
  }

  componentDidMount() {
    SplashScreen.hide();

    let snapBack = () => {
      Animated.timing(this.state.top, {toValue: 0, duration:0}).start();
    }

    this.unsubscribe.push(eventBus.on('focus', (posY) => {
      let keyboardHeight = 340;
      let distFromBottom = height - posY;
      Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration:100}).start()
    }));
    this.unsubscribe.push(eventBus.on('blur', () => {
      Animated.timing(this.state.top, {toValue: 0, duration:100}).start()
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
      <StatusBar barStyle="light-content" />
      <Animated.View style={{flex:1, position:'relative', top: this.state.top}}>
        <AppRouter />
      </Animated.View>
    </View>
  };
}



AppRegistry.registerComponent('Crownstone', () => Root);