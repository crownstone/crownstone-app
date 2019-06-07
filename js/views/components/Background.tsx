
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

import { styles, screenHeight, topBarHeight, tabBarHeight, colors, screenWidth } from "../styles";
import {BackgroundImage} from "./BackgroundImage";
import { NotificationLine } from "./NotificationLine";


export class Background extends Component<{
  hideOrangeBar?:    boolean,
  hideNotification?: boolean,
  hasNavBar?:        boolean,
  fullScreen?:       boolean,
  hasTopBar?:        boolean,
  image:             any,
  topImage?:         any,
  shadedStatusBar?:  boolean,
  keyboardAvoid?:  boolean,
  statusBarStyle?:   any
}, any> {
  render() {
    let hasNavBar = false;
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      hasNavBar = true;
      height -= tabBarHeight;
    }


    return (
      <KeyboardAvoidingView style={[styles.fullscreen, {height:height, overflow:"hidden", backgroundColor:"transparent"}]} behavior={Platform.OS === 'ios' ? 'position' : undefined} enabled={this.props.keyboardAvoid || false}>
        <BackgroundImage height={height} image={this.props.image} />
        {this.props.topImage ? <View style={[styles.fullscreen, {height:height, backgroundColor:"transparent"}]}>{this.props.topImage}</View> : undefined }
        <View style={[styles.fullscreen, {height:height}]} >
          { this.props.hideOrangeBar !== true ? <NotificationLine notificationsVisible={!this.props.hideNotification} /> : true }
          <View style={{flex:1, overflow:'hidden'}}>
            { this.props.shadedStatusBar === true ? <View style={[styles.shadedStatusBar, this.props.statusBarStyle]} /> : undefined}
            {this.props.children}
          </View>
          { hasNavBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
        </View>
      </KeyboardAvoidingView>
    );
  }
}