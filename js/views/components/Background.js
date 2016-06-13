import React, { Component } from 'react' 
import {
  
  Dimensions,
  Image,
  PixelRatio,
  View
} from 'react-native';

import { styles, colors, width, height, pxRatio} from '../styles'


export class Background extends Component {
  render() {
    console.log(this.props)
    return (
      <Image style={[styles.fullscreen,{resizeMode:'cover', width: width, height:height}]} source={this.props.background || require('../../images/background.png')}>
        {this.props.hideInterface !== true ? <View style={{width:width,height:62}} /> : undefined}
        <View style={{flex:1}}>
        {this.props.children}
        </View>
        {this.props.hideInterface !== true && this.props.hideTabBar !== true ? <View style={{width:width,height:50}} /> : undefined}
      </Image>
    );
  }
}