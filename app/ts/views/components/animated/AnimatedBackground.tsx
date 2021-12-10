
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedBackground", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform, StatusBar,
  View
} from "react-native";

import {
  styles,
  screenHeight,
  screenWidth,
  colors,
  updateScreenHeight, availableScreenHeight, availableModalHeight
} from "../../styles";
import {BackgroundImage} from "../BackgroundImage";
import { NotificationLine } from "../NotificationLine";


export class AnimatedBackground extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  hasNavBar?:                boolean,
  darkStatusBar?:            boolean,

  duration?:          number,
  dimStatusBar?:      boolean,
  paddStatusBar?:     boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  testID?:            string,
  topImage?:          any,
  keyboardAvoid?:     boolean,
}, any> {
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


  getHeight() : [number, boolean, boolean] {
    let hasTopBar = false;
    let hasTabBar = false;
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) { hasTopBar = true; }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) { hasTabBar = true; }
    if (hasTabBar && hasTopBar) { height = availableScreenHeight; }
    else if (hasTopBar)         { height = availableModalHeight; }
    return [height, hasTopBar, hasTabBar];
  }

  render() {
    let [backgroundHeight, hasTopBar, hasTabBar] = this.getHeight();
    return (
      <View style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }} testID={this.props.testID}>
        <StatusBar barStyle={this.props.darkStatusBar ? "dark-content" : "light-content"} />
        <View style={[styles.fullscreen, {height:backgroundHeight}]}>
          <View style={[styles.fullscreen, {height:backgroundHeight}]}>
            <BackgroundImage height={backgroundHeight} image={this.staticImage} />
          </View>
          <Animated.View style={[styles.fullscreen, {height:backgroundHeight, opacity:this.state.fade}]}>
            <BackgroundImage height={backgroundHeight} image={this.animatedImage} />
          </Animated.View>
          { this.props.orangeLineAboveStatusBar && Platform.OS !== 'android' ? <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} /> : undefined }
          { this.props.dimStatusBar             && Platform.OS !== 'android' ? <View style={styles.shadedStatusBar} /> : undefined }
          { this.props.paddStatusBar            && Platform.OS !== 'android' ? <View style={styles.statusBarPadding} /> : undefined }
          <NotificationLine notificationsVisible={!this.props.hideNotifications} hideOrangeLine={this.props.hideOrangeLine} />
          <View style={{flex:1, overflow:"hidden"}}>
            { this.props.children }
          </View>
          { hasTabBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
        </View>
      </View>
    );
  }
}