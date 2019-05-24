
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AnimatedBackground", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  View
} from 'react-native';

import { styles, screenHeight, topBarHeight, tabBarHeight, screenWidth, statusBarHeight, colors } from "../../styles";
import {BackgroundImage} from "../BackgroundImage";
import { NotificationLine } from "../NotificationLine";


export class AnimatedBackground extends Component<any, any> {
  staticImage : any;
  animatedImage : any;
  value  : number = 0;

  constructor(props) {
    super(props);

    this.staticImage = props.image;
    this.animatedImage = props.image;
    this.state = {fade: new Animated.Value(0)};
  }

  componentWillReceiveProps(nextProps) {
    let change = false;
    if (this.value === 0) {
      if (nextProps.image !== this.staticImage) {
        change = true;
        this.animatedImage = nextProps.image;
      }
    }
    else {
      if (nextProps.image !== this.animatedImage) {
        change = true;
        this.staticImage = nextProps.image;
      }
    }

    if (change) {
      let newValue = this.value === 0 ? 1 : 0;
      Animated.timing(this.state.fade, {toValue: newValue, duration: this.props.duration || 500}).start();
      this.value = newValue;
    }
  }

  render() {
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
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
        { this.props.dimStatusBar ? <View style={{width:screenWidth, height: statusBarHeight, backgroundColor: colors.black.rgba(0.3)}} /> : undefined }
        { this.props.hideOrangeBar !== true ? <NotificationLine notificationsVisible={!this.props.hideNotification} /> : true }
        <View style={{flex:1, overflow:"hidden"}}>
          { this.props.shadedStatusBar === true ? <View style={[styles.shadedStatusBar, this.props.statusBarStyle]} /> : undefined}
          {this.props.children}
          {/*{ this.props.safeView ? <SafeAreaView style={{flex:1}}>{this.props.children}</SafeAreaView> : this.props.children }*/}
        </View>
      </View>
    );
  }
}