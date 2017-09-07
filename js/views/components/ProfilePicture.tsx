import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
  Text,
  View
} from 'react-native';

import { styles, colors} from '../styles'
import { preparePictureURI } from '../../util/Util'
let Actions = require('react-native-router-flux').Actions;
import { Icon } from './Icon';
import { LOG } from '../../logging/Log'

export class ProfilePicture extends Component<any, any> {
  render() {
    let size = this.props.size || 40;
    let innerSize = this.props.innerSize || size;
    if (this.props.picture !== undefined && this.props.picture !== null) {
      let pictureURI = preparePictureURI(this.props.picture);
      let borderWidth = 0.07*size;
      return (
        <View style={[this.props.style, {width: size, height: size + (this.props.name ? 15 : 0)}]}>
          <Image style={{
            width:size - 0.5*borderWidth,
            height:size - 0.5*borderWidth,
            padding:0,
            margin:0,
            borderRadius:0.5*(size - 0.5*borderWidth),
            borderWidth:borderWidth,
            borderColor: colors.white.hex,
            backgroundColor: 'transparent',
          }} source={{uri:pictureURI}}
          />
          {this.props.name ? <Text style={nameStyle}>{this.props.name}</Text> : undefined}
        </View>
      );
    }
    else {
      return (
        <View style={this.props.style}>
        <View style={[{
              backgroundColor:'#fff',
              width:size,
              height:size,
              borderRadius:0.5*size,
              overflow:'hidden',
              alignItems:'center',
              justifyContent:'center'
             }]}>
          <Icon
            name={this.props.placeHolderIcon || 'ios-contact'}
            size={innerSize} color={this.props.color || colors.menuBackground.hex}
            style={{paddingTop: Platform.OS === 'android' ? 0 : 0.1*size, margin:0}}
          />
        </View>
        {this.props.name ? <Text style={nameStyle}>{this.props.name}</Text> : undefined}
        </View>
      );
    }
  }
}

let nameStyle = {
  color:'#fff',
  fontSize:10,
  fontWeight:'200',
  flex:1,
  backgroundColor:'transparent',
  alignItems:'center',
  justifyContent:'center',
  textAlign:'center'
};