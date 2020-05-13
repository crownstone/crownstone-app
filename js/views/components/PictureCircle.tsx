
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { IconCircle }  from './IconCircle'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { xUtil } from "../../util/StandAloneUtil";

import ImagePicker from 'react-native-image-picker';
import { ImagePickerOptions } from "react-native-image-picker/src/internal/types";

export class PictureCircle extends Component<any, any> {
  triggerOptions() {
    if (this.props.customPictureSelector !== undefined) {
      this.props.customPictureSelector();
      return;
    }

    const options : ImagePickerOptions = {
      title: lang("Select_Picture"),
      noData: true,
      mediaType: "photo",
      storageOptions: {
        waitUntilSaved: false,
        cameraRoll: false,
        privateDirectory:true,
        skipBackup: true,
      },
      allowsEditing: true,
      quality: 0.99
    };

    ImagePicker.showImagePicker(options, (response) => {
      // console.log('Response = ', response);

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
      } else {
        this.props.callback(response.uri)
      }
    });
  }

  render() {
    let size = this.props.size || 60;
    if (this.props.value || this.props.imageURI) {
      let imageURI = this.props.imageURI || {uri:xUtil.preparePictureURI(this.props.value)}
      let borderWidth = this.props.borderWidth || size / 30;
      let innerSize = size - 2*borderWidth;
      return (
        <TouchableOpacity
          onPress={() => {
            if (this.props.stock) {
              this.props.removePicture();
              this.triggerOptions();
            }
            else {
              Alert.alert(
                lang("_Delete_this_picture__arg_header"),
                lang("_Delete_this_picture__arg_body",undefined),
                [
                  {text:lang("_Delete_this_picture__arg_left")},
                  {text:lang("_Delete_this_picture__arg_right"), onPress:() => { this.props.removePicture(); this.triggerOptions(); }}
                ]
              )
            }
          }}
          style={{
            height:size,
            width:size,
            borderRadius: 0.5*size,
            backgroundColor: colors.white.hex,
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Image style={{width:innerSize, height:innerSize, borderRadius:innerSize * 0.5, backgroundColor: 'transparent'}} source={imageURI} />
            <View style={[{
              position: 'absolute',
              top: 0,
              right: 2,
              width:size/3,
              height:size/3,
              borderRadius:size/6,
              backgroundColor: colors.blue3.hex,
              borderColor: colors.white.hex,
              borderWidth: borderWidth
              }, styles.centered]}>
                <Icon name={'md-remove'} size={size/5} color={'#ffffff'} />
            </View>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={{flexDirection:'row',alignItems:'center', justifyContent:'center'}}>
          <TouchableOpacity onPress={() => {this.triggerOptions()}} style={{height:size}}>
            <View>
              <IconCircle icon={'ios-camera-outline'} size={size} color='#ccc' showAdd={true} outerBorderWidth={2} />
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
