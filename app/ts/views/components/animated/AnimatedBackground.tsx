
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedBackground", key)(a,b,c,d,e);
}
import * as React from 'react'; import {Component, useEffect, useState} from 'react';
import {
  Animated, Platform, SafeAreaView,
  View, Text, AppState, NativeEventSubscription, StatusBar
} from "react-native";

import {
  styles,
  screenHeight,
  screenWidth,
  colors,
  updateScreenHeight, availableScreenHeight, availableModalHeight
} from "../../styles";
import {BackgroundImage} from "../BackgroundImage";
import { CustomKeyboardAvoidingView } from "../CustomKeyboardAvoidingView";
import {SafeAreaProvider} from "react-native-safe-area-context";



export class AnimatedBackground extends Component<AnimatedBackgroundProps, any> {
  staticImage : any;
  animatedImage : any;
  backgroundOpacity  : number = 0;

  constructor(props) {
    super(props);

    this.staticImage = this.props.image;
    this.animatedImage = this.props.image;
    this.state = {fade: new Animated.Value(0)};
  }


  shouldComponentUpdate(nextProps){
    let imageChanged = false;
    if (this.backgroundOpacity === 0) {
      if (nextProps.image !== this.staticImage) {
        imageChanged = true;
        this.animatedImage = nextProps.image;
      }
    }
    else {
      if (nextProps.image !== this.animatedImage) {
        imageChanged = true;
        this.staticImage = nextProps.image;
      }
    }

    if (imageChanged) {
      let newValue = this.backgroundOpacity === 0 ? 1 : 0;
      Animated.timing(this.state.fade, {toValue: newValue, useNativeDriver: false, duration: nextProps.duration || 500}).start();
      this.backgroundOpacity = newValue;
    }
    return true
  }


  render() {
    let [backgroundHeight, hasTopBar, hasTabBar] = getHeight(this.props);
    let Wrapper = this.props.viewWrapper ? View : SafeAreaProvider;
    return (
      <Wrapper style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }} testID={this.props.testID}>
        <StatusBar barStyle={this.props.lightStatusbar ? 'light-content' : 'dark-content'} />
        <View style={[styles.fullscreen, {height:backgroundHeight}]}>
          <BackgroundImage height={backgroundHeight} image={this.staticImage} />
        </View>
        <Animated.View style={[styles.fullscreen, {height:backgroundHeight, opacity:this.state.fade}]}>
          <BackgroundImage height={backgroundHeight} image={this.animatedImage} />
        </Animated.View>
        <CustomKeyboardAvoidingView style={{flex:1}}>
          {/*<NotificationLine notificationsVisible={!this.props.hideNotifications} hideOrangeLine={this.props.hideOrangeLine} />*/}
          <View style={{flex:1}}>
            { this.props.children }
          </View>
        </CustomKeyboardAvoidingView>
      </Wrapper>
    );
  }
}


export function getHeight(props) : [number, boolean, boolean] {
  let hasTopBar = false;
  let hasTabBar = false;
  let height = screenHeight;
  if (props.hasTopBar !== false && props.fullScreen !== true) { hasTopBar = true; }
  if (props.hasNavBar !== false && props.fullScreen !== true) { hasTabBar = true; }
  if (hasTabBar && hasTopBar) { height = availableScreenHeight; }
  else if (hasTopBar)         { height = availableModalHeight; }
  return [height, hasTopBar, hasTabBar];
}
