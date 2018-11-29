'use strict';
import * as React from 'react'; import { Component } from 'react';
import { Animated, Keyboard, StatusBar,  View, Platform } from 'react-native';

import { AppRouter } from './js/router/Router'
import { eventBus } from './js/util/EventBus'
import { BackgroundProcessHandler } from './js/backgroundProcesses/BackgroundProcessHandler'
import { colors, screenWidth, screenHeight } from './js/views/styles'
import SplashScreen from 'react-native-splash-screen'

export class Root extends Component {
  constructor() {
    super();

    this.state = {top: new Animated.Value(0)};
    this.unsubscribe = [];
    BackgroundProcessHandler.start();
  }

  // this is used to scroll the view up when typing is active
  componentDidMount() {
    if (Platform.OS === 'ios') {


      SplashScreen.hide();

      let keyboardHeight = null;


      let moveUpForKeyboard_onKeyboardEvent = () => {};
      let keyboardDidShow = (event) => {
        keyboardHeight = event.endCoordinates.height;
        moveUpForKeyboard_onKeyboardEvent();
        moveUpForKeyboard_onKeyboardEvent = () => {};
      }
      let keyboardDidHide = (event) => {
        // console.log("keyboardDidHide", event)
      }

      this.focusTime = 0;

      let snapBack = () => {
        this.state.top.stopAnimation()
        Animated.timing(this.state.top, {toValue: 0, duration:0}).start();
      };
      let snapBackKeyboard = () => {
        this.state.top.stopAnimation()
        if (new Date().valueOf() - this.focusTime > 100) {
          Animated.timing(this.state.top, {toValue: 0, duration: 200}).start();
        }
      };

      let moveUpForKeyboard = (posY_bottomTextfield) => {
        this.state.top.stopAnimation()
        let distFromBottom = screenHeight - ((posY_bottomTextfield + 20) - this.state.top._value); // 20 is padding
        this.focusTime = new Date().valueOf();
        Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration: 200}).start()
      }

      this.unsubscribe.push(eventBus.on('focus', (posY_bottomTextfield) => {
        if (keyboardHeight === null) {
          moveUpForKeyboard_onKeyboardEvent = () => { moveUpForKeyboard(posY_bottomTextfield); };
        }
        else {
          moveUpForKeyboard(posY_bottomTextfield);
        }
      }));
      this.unsubscribe.push(eventBus.on('hidePopup', snapBackKeyboard));
      this.unsubscribe.push(eventBus.on('showPopup', snapBackKeyboard));
      this.unsubscribe.push(eventBus.on('blur',      snapBackKeyboard));

      // catch for the simulator
      this.unsubscribe.push(eventBus.on('showLoading',  snapBack));
      this.unsubscribe.push(eventBus.on('showProgress', snapBack));
      this.unsubscribe.push(eventBus.on('hideLoading',  snapBack));
      this.unsubscribe.push(eventBus.on('hideProgress', snapBack));
      this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    }
  }


  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
    this.unsubscribe.forEach((callback) => { callback() });
    this.unsubscribe = [];
  }


  render() {
    if (Platform.OS === 'ios') {
      return (
        <View style={{flex: 1, backgroundColor: colors.menuBackgroundDarker.hex}}>
          <StatusBar barStyle="light-content"/>
          <Animated.View style={{flex: 1, position: 'relative', top: this.state.top}}>
            <AppRouter/>
          </Animated.View>
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


