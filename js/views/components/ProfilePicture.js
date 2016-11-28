import React, { Component } from 'react' 
import {
  Image,
  Text,
  View
} from 'react-native';

import { styles, colors} from '../styles'
import { preparePictureURI } from '../../util/util'
let Actions = require('react-native-router-flux').Actions;
import { Icon } from './Icon';
import { LOG } from '../../logging/Log'

export class ProfilePicture extends Component {
  render() {
    let size = this.props.size || 40;
    let innerSize = this.props.innerSize || size;
    if (this.props.picture !== undefined && this.props.picture !== null) {
      let pictureURI = preparePictureURI(this.props.picture);
      let borderWidth = 0.07*size;
      LOG("PICTURE SIZE: ", size, "pictureURI", pictureURI);
      return (
        <View style={this.props.style}>
        <View style={{
            paddingRight: 10,
            width:size,
            height:size,
            borderRadius:0.5*size,
            borderWidth:borderWidth,
            borderColor:"#fff"}}>
          <Image style={{
            width:size-2*borderWidth,
            height:size-2*borderWidth,
            padding:0,
            margin:0,
            borderRadius:0.5*(size-2*borderWidth),
            backgroundColor: '#fff',
            // borderColor: colors.menuBackground.hex,
            // borderWidth: size/30
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
            name={this.props.placeHolderIcon || 'ios-contact'}
            size={innerSize} color={this.props.color || colors.menuBackground.hex}
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
};