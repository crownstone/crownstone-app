
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("FinalizeLocalizationIcon", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
  View
} from 'react-native';
import { Icon } from './Icon'
import {colors, statusBarHeight, topBarHeight} from '../styles'

export class FinalizeLocalizationIcon extends Component<any, any> {
  render() {
    let size = 37;
    let markSize = 0.5*size;
    return (
      <View style={{backgroundColor:'transparent', height: size, width: size + 0.1*markSize}}>
        <Icon name="ios-navigate" color={this.props.color || '#fff'} size={size} />
        <View
          style={{
            position:'absolute', top: 0, left: size-0.9*markSize,
            backgroundColor: '#fff',
            width: markSize, height:markSize, borderRadius: 0.5*markSize,
            alignItems:'center', justifyContent:'center'
          }}>
          <Icon name="ios-checkmark-circle" color={this.props.color || colors.iosBlue.hex} size={markSize}/>
        </View>
      </View>
    )
  }
}
