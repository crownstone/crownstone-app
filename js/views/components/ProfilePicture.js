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
    let innerSize = this.props.innerSize || size;
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
        <View  style={this.props.style}>
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
            size={innerSize} color={this.props.color || colors.menuBackground.h}
            style={{paddingTop:0.1*size, margin:0}}
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
}