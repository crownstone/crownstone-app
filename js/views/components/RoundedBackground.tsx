
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  KeyboardAvoidingView, Platform,
  View
} from "react-native";
// import { SafeAreaView } from 'react-navigation';

import {
  styles,
  screenHeight,
  topBarHeight,
  tabBarHeight,
  colors,
  screenWidth,
  updateScreenHeight, availableScreenHeight, availableModalHeight, stylesUpdateConstants
} from "../styles";
import { BackgroundImage  } from "./BackgroundImage";
import { NotificationLine } from "./NotificationLine";
import { SceneConstants } from "../scenesViews/constants/SceneConstants";


export class RoundedBackground extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  style?:                    any,
  hasNavBar?:                boolean,

  dimStatusBar?:      boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  topImage?:          any,
  keyboardAvoid?:     boolean,
}, any> {


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
    let overrideStyle = this.props.style || {};
    return (
      <View style={{backgroundColor: colors.csBlueDarker.hex, flex:1}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height, hasTopBar, hasTabBar);
      }}>
        <View style={{backgroundColor: colors.csOrange.hex, flex:1, borderRadius: SceneConstants.roundness, overflow: 'hidden'}}>
          <View style={{height:2, width: screenWidth, backgroundColor: "transparent"}} />
            <View>
            <KeyboardAvoidingView style={[styles.fullscreen, {height:backgroundHeight, overflow:"hidden", backgroundColor:"transparent"}, overrideStyle]} behavior={Platform.OS === 'ios' ? 'position' : undefined} enabled={this.props.keyboardAvoid || false}>
              { this.props.image    ? <BackgroundImage height={backgroundHeight} image={this.props.image} /> : undefined }
              { this.props.topImage ? <View style={[styles.fullscreen, {height:backgroundHeight, backgroundColor:"transparent"}]}>{this.props.topImage}</View> : undefined }
              <View style={[styles.fullscreen, {height:backgroundHeight}]}>
                { this.props.orangeLineAboveStatusBar && Platform.OS !== 'android' ? <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} /> : undefined }
                { this.props.dimStatusBar && Platform.OS !== 'android' ? <View style={styles.shadedStatusBar} /> : undefined }
                <NotificationLine notificationsVisible={!this.props.hideNotifications} hideOrangeLine={this.props.hideOrangeLine} />
                <View style={{flex:1, overflow:'hidden'}}>
                  { this.props.children }
                </View>
                { hasTabBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </View>
    );
  }
}