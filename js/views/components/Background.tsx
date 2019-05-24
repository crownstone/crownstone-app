
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Background", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';
// import { SafeAreaView } from 'react-navigation';

import { styles, screenHeight, topBarHeight, tabBarHeight,  } from "../styles";
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
  statusBarStyle?:   any
}, any> {
  render() {
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      height -= tabBarHeight;
    }
    return (
      <View style={[styles.fullscreen, {height:height, overflow:"hidden", backgroundColor:"transparent"}]} >
        <BackgroundImage height={height} image={this.props.image} />
        {this.props.topImage ? <View style={[styles.fullscreen, {height:height, backgroundColor:"transparent"}]}>{this.props.topImage}</View> : undefined }
        <View style={[styles.fullscreen, {height:height}]} >
          { this.props.hideOrangeBar !== true ? <NotificationLine notificationsVisible={!this.props.hideNotification} /> : true }
          <View style={{flex:1, overflow:'hidden'}}>
            { this.props.shadedStatusBar === true ? <View style={[styles.shadedStatusBar, this.props.statusBarStyle]} /> : undefined}
            {this.props.children}
          </View>
        </View>
      </View>
    );
  }
}