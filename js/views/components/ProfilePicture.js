import React, { Component } from 'react' 
import {
  Image,
  Text,
  View
} from 'react-native';

import { styles, colors} from '../styles'
import { preparePictureURI } from '../../util/util'
var Actions = require('react-native-router-flux').Actions;
var Icon = require('react-native-vector-icons/Ionicons');

export class ProfilePicture extends Component {
  render() {
    let size = this.props.size || 40;
    if (this.props.picture !== undefined && this.props.picture !== null) {
      let pictureURI = preparePictureURI(this.props.picture);

      return (
        <View style={{paddingRight: 10}}>
          <Image style={{
            width:size,
            height:size,
            borderRadius:size * 0.5,
            backgroundColor: '#ffffff',
            // borderColor: colors.menuBackground.h,
            // borderWidth: size/30
            }} source={{uri:pictureURI}}
          />
        </View>
      );
    }
    else {
      return (
        <View style={{position:'relative', top:3, paddingRight: 10}}>
          <Icon name={this.props.placeHolderIcon || 'ios-contact'} size={size} color={this.props.color || colors.menuBackground.h} />
        </View>
      );
    }
  }
}