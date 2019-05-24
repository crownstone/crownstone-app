// 'use strict';
// import * as React from 'react';
// import { Component } from 'react';
//
// import { Animated, Keyboard, View, Platform } from 'react-native';
//
// import { BackgroundProcessHandler } from './js/backgroundProcesses/BackgroundProcessHandler'
// import { colors, screenWidth, screenHeight } from './js/views/styles'
// import SplashScreen from 'react-native-splash-screen'
// import { Router } from "./js/router/Router";
// import { core } from "./js/core";
//
// import { LoginSplash } from "./js/views/startupViews/LoginSplash";
//
//
//
// export class Root extends Component<any, any> {
//   unsubscribe = [];
//   keyboardDidShowListener = null;
//   keyboardDidHideListener = null;
//   focusTime = 0;
//
//   constructor(props) {
//     super(props);
//
//     this.state = {top: new Animated.Value(0)};
//     BackgroundProcessHandler.start();
//   }
//
//   // this is used to scroll the view up when typing is active
//   componentDidMount() {
//     if (Platform.OS === 'ios') {
//       SplashScreen.hide();
//
//       let keyboardHeight = null;
//
//       let moveUpForKeyboard_onKeyboardEvent = () => {};
//       let keyboardDidShow = (event) => {
//         keyboardHeight = event.endCoordinates.height;
//         moveUpForKeyboard_onKeyboardEvent();
//         moveUpForKeyboard_onKeyboardEvent = () => {};
//       };
//       let keyboardDidHide = (event) => {
//         // console.log("keyboardDidHide", event)
//       };
//
//       this.focusTime = 0;
//
//       let snapBack = () => {
//         this.state.top.stopAnimation();
//         Animated.timing(this.state.top, {toValue: 0, duration:0}).start();
//       };
//       let snapBackKeyboard = () => {
//         this.state.top.stopAnimation();
//         if (new Date().valueOf() - this.focusTime > 100) {
//           Animated.timing(this.state.top, {toValue: 0, duration: 200}).start();
//         }
//       };
//
//       let moveUpForKeyboard = (posY_bottomTextfield) => {
//         this.state.top.stopAnimation();
//         let distFromBottom = screenHeight - ((posY_bottomTextfield + 20) - this.state.top._value); // 20 is padding
//         this.focusTime = new Date().valueOf();
//         Animated.timing(this.state.top, {toValue: Math.min(0,distFromBottom - keyboardHeight), duration: 200}).start()
//       };
//
//       this.unsubscribe.push(core.eventBus.on('focus', (posY_bottomTextfield) => {
//         if (keyboardHeight === null) {
//           moveUpForKeyboard_onKeyboardEvent = () => { moveUpForKeyboard(posY_bottomTextfield); };
//         }
//         else {
//           moveUpForKeyboard(posY_bottomTextfield);
//         }
//       }));
//       this.unsubscribe.push(core.eventBus.on('hidePopup', snapBackKeyboard));
//       this.unsubscribe.push(core.eventBus.on('showPopup', snapBackKeyboard));
//       this.unsubscribe.push(core.eventBus.on('blur',      snapBackKeyboard));
//
//       // catch for the simulator
//       this.unsubscribe.push(core.eventBus.on('showLoading',  snapBack));
//       this.unsubscribe.push(core.eventBus.on('showProgress', snapBack));
//       this.unsubscribe.push(core.eventBus.on('hideLoading',  snapBack));
//       this.unsubscribe.push(core.eventBus.on('hideProgress', snapBack));
//       this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
//       this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
//     }
//   }
//
//
//   componentWillUnmount() {
//     if (Platform.OS === 'ios') {
//       this.keyboardDidShowListener.remove();
//       this.keyboardDidHideListener.remove();
//     }
//     this.unsubscribe.forEach((callback) => { callback() });
//     this.unsubscribe = [];
//   }
//
//
//   render() {
//     if (Platform.OS === 'ios') {
//       return (
//         <View style={{flex: 1, backgroundColor: colors.menuBackgroundDarker.hex}}>
//           <Animated.View style={{flex: 1, position: 'relative', top: this.state.top}}>
//             <LoginSplash />
//           </Animated.View>
//         </View>
//       );
//     }
//     else {
//       return (
//         <View style={{flex:1}}>
//           <LoginSplash />
//         </View>
//       )
//     }
//   };
// }
