import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FadeInView }   from '../animated/FadeInView'
import { Icon }         from '../Icon'
import {styles, colors, screenHeight, screenWidth, availableScreenHeight} from '../../styles'

export class OverlayBox extends Component<any, any> {
  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor: this.props.backgroundColor || colors.csBlue.rgba(0.2), justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        maxOpacity={this.props.maxOpacity}
        visible={this.props.visible}>
        <View style={{backgroundColor:colors.white.rgba(0.5), width:0.85*screenWidth, height: this.props.height || Math.min(500,0.95*availableScreenHeight), borderRadius: 25, padding: 0.03*screenWidth}}>
          <View style={[styles.centered, {backgroundColor:'#fff', flex:1, borderRadius: 25-0.02*screenWidth, padding: 0.03*screenWidth}]}>
            {this.props.children}
          </View>
          { this.props.canClose === true ?
            <TouchableOpacity onPress={this.props.closeCallback} style={{position:'absolute', top:0, right:0, width:40, height:40, backgroundColor: colors.csBlue.hex, borderRadius:20, borderWidth:3, borderColor:'#fff', alignItems:'center', justifyContent:'center'}}>
              <Icon name="md-close" size={30} color="#fff" style={{position:'relative', top:1, right:0}}/>
            </TouchableOpacity> : undefined}
        </View>
      </FadeInView>
    );
  }
}