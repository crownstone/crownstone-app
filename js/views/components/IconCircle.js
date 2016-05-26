import React, { Component } from 'react' 
import {
  
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');

import { styles, colors} from '../styles'


export class IconCircle extends Component {
  render() {
    return (
      <View>
        <View style={[{
          width:60,
          height:60,
          borderRadius:30,
          backgroundColor: '#ffffff',
          borderColor: this.props.color || colors.menuBackground.h,
          borderWidth: 2
          }, styles.centered]}>
          <Icon name={this.props.icon} size={40} color={this.props.color || colors.menuBackground.h} />
        </View>
        {this.props.showEdit === true ?
          <View style={[{
            marginTop:-61,
            marginLeft:41,
            width:22,
            height:22,
            borderRadius:11,
            backgroundColor: colors.green.h,
            borderColor: '#ffffff',
            borderWidth: 2
          }, styles.centered]}>
            <Icon name={'android-create'} size={13} color={'#ffffff'} />
          </View> : undefined}
        {this.props.showAdd === true ?
          <View style={[{
            marginTop:-61,
            marginLeft:41,
            width:22,
            height:22,
            borderRadius:11,
            backgroundColor: colors.green.h,
            borderColor: '#ffffff',
            borderWidth: 2
          }, styles.centered]}>
            <Icon name={'android-add'} size={13} color={'#ffffff'} />
          </View> : undefined}
      </View>
    );
  }
}