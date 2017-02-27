import * as React from 'react'; import { Component } from 'react';
import {
  Platform,
  Text,
  View
} from 'react-native';
import { Icon } from './Icon'
import { styles, colors } from '../styles'

export class FinalizeLocalizationIcon extends Component<any, any> {
  render() {
    let top = Platform.OS === 'android' ? 0 : 1;
    let topOffset = 0;
    if (this.props.topBar === true && Platform.OS === 'android') {
      topOffset = 10;
    }

    return (
      <View style={{backgroundColor:'transparent', height:35, width:40, position:'relative', top: topOffset}}>
        <Icon name="ios-navigate" color={this.props.color || '#fff'} size={35} style={{alignItems:'center', justifyContent:'center', height:35}} />
        <View
          style={{position:'relative', top:-35, left:20, backgroundColor: '#fff', width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center'}}>
          <Icon name="ios-checkmark-circle" color={this.props.color || colors.iosBlue.hex} size={18} style={{position:'relative', top:top, left:0}}/>
        </View>
      </View>
    )
  }
}
