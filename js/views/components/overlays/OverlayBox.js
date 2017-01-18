import React, { Component } from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native';

import { FadeInView }         from '../animated/FadeInView'
import { styles, colors , screenHeight, screenWidth } from '../../styles'

export class OverlayBox extends Component {
  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.props.visible}>
        <View style={{backgroundColor:colors.white.rgba(0.5), width:0.85*screenWidth, height: this.props.height || 0.75*screenHeight, borderRadius: 25, padding: 0.03*screenWidth}}>
          <View style={[styles.centered, {backgroundColor:'#fff', flex:1, borderRadius: 25-0.02*screenWidth, padding: 0.03*screenWidth}]}>
            {this.props.children}
          </View>
        </View>
      </FadeInView>
    );
  }
}