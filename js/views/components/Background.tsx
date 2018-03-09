import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-navigation';

import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight} from '../styles'


export class Background extends Component<any, any> {
  render() {
    let height = screenHeight;
    if (this.props.hasTopBar !== false && this.props.fullScreen !== true) {
      height -= topBarHeight;
    }
    if (this.props.hasNavBar !== false && this.props.fullScreen !== true) {
      height -= tabBarHeight;
    }

    return (
      <View style={[styles.fullscreen, {height:height}]} >
        {this.props.image}
        <View style={[styles.fullscreen, {height:height}]} >
          <View style={{flex:1}}>
            {this.props.children}
          </View>
        </View>
      </View>
    );
  }
}