import React, { Component } from 'react' 
import {
  Image,
  Text,
  View
} from 'react-native';

import { styles, colors} from '../styles'
import { preparePictureURI } from '../../util/util'

export class TextCircle extends Component {
  render() {
    let size = this.props.size || 40;
    let borderWidth = 0.07*size;
    return (
      <View style={this.props.style}>
        <View style={[{
            width:size,
            height:size,
            backgroundColor:colors.blue.hex,
            borderRadius:0.5*size,
            borderWidth:borderWidth,
            borderColor:"#fff"}, styles.centered]}>
          <Text style={nameStyle}>{this.props.text}</Text>
        </View>
      </View>
    );
  }
}

let nameStyle = {
  color:'#fff',
  fontSize:15,
  backgroundColor:'transparent',
};