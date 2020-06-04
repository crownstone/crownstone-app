
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedBackground", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform,
  View
} from "react-native";

import {
  styles,
  screenHeight,
  topBarHeight,
  tabBarHeight,
  screenWidth,
  statusBarHeight,
  colors,
  updateScreenHeight
} from "../../styles";
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
      Animated.timing(this.state.fade, {toValue: newValue, duration: nextProps.duration || 500}).start();
      this.backgroundOpacity = newValue;
    }
    return true
  }


  render() {
    let hasNavBar = false;
    let heightOffset = 0;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      heightOffset += topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      hasNavBar = true;
      heightOffset += tabBarHeight;
    }
    let height = screenHeight - heightOffset;

    return (
      <View style={{flex:1, backgroundColor: colors.csBlueDarker.hex}} onLayout={(event) => {
        let {x, y, width, height} = event.nativeEvent.layout;
        updateScreenHeight(height+heightOffset);
      }}>
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
      </View>
    );
  }
}