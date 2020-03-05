
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedBackground", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform,
  View
} from "react-native";

import { styles, screenHeight, topBarHeight, tabBarHeight, screenWidth, statusBarHeight, colors } from "../../styles";
import {BackgroundImage} from "../BackgroundImage";
import { NotificationLine } from "../NotificationLine";


export class AnimatedBackground extends Component<{
  hideNotifications?:        boolean,
  hideOrangeLine?:           boolean,
  orangeLineAboveStatusBar?: boolean,
  hasNavBar?:                boolean,

  duration?:          number,
  dimStatusBar?:      boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  topImage?:          any,
  keyboardAvoid?:     boolean,
}, any> {
  staticImage : any;
  animatedImage : any;
  value  : number = 0;

  constructor(props) {
    super(props);

    this.staticImage = this.props.image;
    this.animatedImage = this.props.image;
    this.state = {fade: new Animated.Value(0)};
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    let change = false;
    if (this.value === 0) {
      if (this.props.image !== this.staticImage) {
        change = true;
        this.animatedImage = this.props.image;
      }
    }
    else {
      if (this.props.image !== this.animatedImage) {
        change = true;
        this.staticImage = this.props.image;
      }
    }
    return change;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // let change = false;
    // if (this.value === 0) {
    //   if (this.props.image !== this.staticImage) {
    //     change = true;
    //     this.animatedImage = this.props.image;
    //   }
    // }
    // else {
    //   if (this.props.image !== this.animatedImage) {
    //     change = true;
    //     this.staticImage = this.props.image;
    //   }
    // }
    console.log("this is my snapshot", snapshot)
    if (snapshot) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.fade, {toValue: newValue, duration: this.props.duration || 500}).start();
      this.value = newValue;
    }
  }

  render() {

    console.log(this.staticImage, this.animatedImage)
    let height = screenHeight;
    let hasNavBar = false;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      hasNavBar = true;
      height -= tabBarHeight;
    }

    return (
      <View style={[styles.fullscreen, {height:height}]}>
        <View style={[styles.fullscreen, {height:height}]}>
          <BackgroundImage height={height} image={this.staticImage} />
        </View>
        <Animated.View style={[styles.fullscreen, {height:height, opacity:this.state.fade}]}>
          <BackgroundImage height={height} image={this.animatedImage} />
        </Animated.View>
        { this.props.orangeLineAboveStatusBar && Platform.OS !== 'android' ? <View style={{backgroundColor:colors.csOrange.hex, height: 2, width: screenWidth}} /> : undefined }
        { this.props.dimStatusBar             && Platform.OS !== 'android' ? <View style={styles.shadedStatusBar} /> : undefined }
        <NotificationLine notificationsVisible={!this.props.hideNotifications} hideOrangeLine={this.props.hideOrangeLine} />
        <View style={{flex:1, overflow:"hidden"}}>
          { this.props.children }
        </View>
        { hasNavBar ? <View style={{backgroundColor:colors.csBlueLightDesat.rgba(0.3), width:screenWidth, height:1}} /> : null}
      </View>
    );
  }
}