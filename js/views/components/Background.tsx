import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

import { styles, colors, screenWidth, screenHeight, statusBarHeight, topBarHeight, tabBarHeight} from '../styles'


export class Background extends Component<{hasNavBar?: boolean, fullScreen?: boolean, hasTopBar?: boolean, image: any, shadedStatusBar?: boolean}, any> {
  render() {
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      height -= tabBarHeight;
    }

    return (
      <View style={[styles.fullscreen, {height:height, overflow:"hidden"}]} >
        {this.props.image}
        <View style={[styles.fullscreen, {height:height}]} >
          { this.props.shadedStatusBar === true ? <View style={styles.shadedStatusBar} /> : undefined}
          <SafeAreaView style={{flex:1}}>
            {this.props.children}
          </SafeAreaView>
        </View>
      </View>
    );
  }
}