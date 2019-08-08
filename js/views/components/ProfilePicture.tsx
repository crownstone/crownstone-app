
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ProfilePicture", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text, TextStyle,
  View
} from "react-native";

import { colors} from '../styles'
import { Icon } from './Icon';
import { xUtil } from "../../util/StandAloneUtil";

export class ProfilePicture extends Component<any, any> {
  render() {
    let size = this.props.size || 40;
    let innerSize = this.props.innerSize || size;
    if (this.props.picture !== undefined && this.props.picture !== null) {
      let pictureURI = xUtil.preparePictureURI(this.props.picture);
      let borderWidth = this.props.borderWidth || 0.07*size;
      let innerBorderSize = size - 2 * borderWidth;
      return (
        <View style={this.props.style}>
          <View style={{
            width:   size,
            height:  size,
            padding: 0,
            margin:  0,
            borderRadius: 0.5*size,
            backgroundColor: colors.white.hex,
            alignItems:'center',
            justifyContent:'center'
          }}>
            <Image style={{
              width:   innerBorderSize,
              height:  innerBorderSize,
              borderRadius: 0.5*innerBorderSize,
              backgroundColor: 'transparent',
            }} source={{uri:pictureURI}}
            />
          </View>
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
              name={ this.props.placeHolderIcon || 'ios-contact' }
              size={ innerSize } color={this.props.color || colors.menuBackground.hex}
              ignoreCorrection={ true }
            />
          </View>
          {this.props.name ? <Text style={nameStyle}>{this.props.name}</Text> : undefined}
        </View>
      );
    }
  }
}

let nameStyle : TextStyle = {
  color:'#fff',
  fontSize:10,
  fontWeight:'200',
  flex:1,
  backgroundColor:'transparent',
  alignItems:'center',
  justifyContent:'center',
  textAlign:'center'
};