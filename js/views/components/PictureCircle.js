import React, { Component } from 'react' 
import {
  Image,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from './IconCircle'

import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { eventBus } from '../../util/eventBus'
import { preparePictureURI } from '../../util/util'
var Actions = require('react-native-router-flux').Actions;

export class PictureCircle extends Component {
  triggerOptions() {
    let buttons = [
      {text: 'Take Picture', callback: () => {Actions.pictureView({selectCallback:this.props.callback});}},
      {text: 'Choose Existing', callback: () => {Actions.cameraRollView({selectCallback:this.props.callback});}}
    ];
    eventBus.emit('showPopup', buttons);
  }

  render() {
    let size = this.props.size || 60;
    if (this.props.value !== undefined && this.props.value !== null) {

      let imageURI = preparePictureURI(this.props.value);
      console.log("SHOWING PICTURE:", imageURI)
      let borderWidth = size/30;
      return (
        <TouchableOpacity onPress={this.props.removePicture} style={{height:size}}>
          <View>
            <View style={{width:size,
                  height:size,
                  borderRadius:size * 0.5,
                  backgroundColor: '#ffffff',
                  borderColor: '#fff',
                  borderWidth: borderWidth}}>
              <Image style={{
                  width:size-2*borderWidth,
                  height:size-2*borderWidth,
                  borderRadius:(size-2*borderWidth) * 0.5,
                  backgroundColor: '#ffffff',
                  }} source={{uri:imageURI}} />
                <View style={[{
                    marginTop:-size-1,
                    marginLeft:size*2/3 + 1,
                    width:size/3,
                    height:size/3,
                    borderRadius:size/6,
                    backgroundColor: colors.red.hex,
                    borderColor: '#ffffff',
                    borderWidth: size/30
                  }, styles.centered]}>
                <Icon name={'ios-remove'} size={size/5} color={'#ffffff'} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={{flexDirection:'row',alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity onPress={() => {this.triggerOptions()}} style={{height:size}}>
            <View>
              <IconCircle icon={'ios-camera-outline'} size={size} color='#ccc' showAdd={true} />
            </View>
          </TouchableOpacity>
          { this.props.placeholderText ?
            <Text style={{padding:10, color:colors.gray.hex, fontSize: 16}}>{this.props.placeholderText}</Text> :
            undefined}
        </View>
      );
    }
  }
}