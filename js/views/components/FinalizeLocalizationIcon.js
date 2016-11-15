import React, {Component} from 'react'
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
import { Icon } from './Icon'
import { LOG, LOGError, LOGDebug } from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'

export class FinalizeLocalizationIcon extends Component {
  render() {
    return (
      <View style={{backgroundColor:'transparent', height:35, width:40}}>
        <Icon name="ios-navigate" color="#fff" size={35} style={{alignItems:'center', justifyContent:'center', height:35}} />
        <View
          style={{position:'relative', top:-35, left:20, backgroundColor:'#fff', width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center'}}>
          <Icon name="ios-checkmark-circle" color={colors.iosBlue.hex} size={18}
                style={{position:'relative', top:1, left:0}}/>
        </View>
      </View>
    )
  }
}
