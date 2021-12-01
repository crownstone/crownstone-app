
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  TouchableOpacity,
  View, ViewStyle
} from "react-native";

import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { NavigationUtil } from "../../util/NavigationUtil";


export class PictureGallerySelector extends Component<any, any> {
  render() {
    let size = this.props.size || 60;
    let borderWidth = this.props.borderWidth || size / 30;
    let imageSource = this.props.value;
    let innerSize = size - 2.2*borderWidth;
    let width = size;
    let height = 0.75*width;
    let innerWidth = innerSize;
    let innerHeight = 0.73*innerWidth;
    let iconSize = size/3;

    let wrapperStyle : ViewStyle = {
      height:height,
      width:width,
      borderRadius: 10+borderWidth/2,
      marginTop:0.3*iconSize,
      marginLeft:0.3*iconSize,
      backgroundColor: colors.white.hex,
      alignItems:'center',
      justifyContent:'center',
    };
    let indicatorIconStyle : ViewStyle = {
      position: 'absolute', right: 0, top: 0,
      width: iconSize,
      height: iconSize,
      borderRadius: iconSize * 0.5,
      backgroundColor: colors.csBlue.hex,
      borderColor: '#ffffff',
      borderWidth: borderWidth,
      ...styles.centered
    };
    let touchableStyle : ViewStyle = {
      height:height+0.3*iconSize,
      width:width+0.6*iconSize, overflow:"hidden"
    };
    if (this.props.value !== undefined && this.props.value !== null) {
      return (
        <TouchableOpacity
          onPress={() => { this.props.removePicture(); }}
          style={touchableStyle}>
          <View style={wrapperStyle}>
            <Image style={{width:innerWidth, height:innerHeight, borderRadius: 10, backgroundColor: 'transparent'}} source={imageSource} />
          </View>
          <View style={indicatorIconStyle}>
            <Icon name={'md-trash'} size={iconSize/2} color={'#ffffff'} />
          </View>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <TouchableOpacity
          onPress={() => {
            NavigationUtil.launchModal("ScenePictureGallery", {callback: this.props.callback });
          }}
          style={touchableStyle}>
          <View style={wrapperStyle}>
            <Icon name={'ios-images'} size={height*0.6} color='#ccc'  />
          </View>
          <View style={{...indicatorIconStyle, backgroundColor: colors.green.hex}}>
            <Icon name={'md-add'} size={iconSize/2} color={'#ffffff'} />
          </View>
        </TouchableOpacity>
      );
    }
  }

}
