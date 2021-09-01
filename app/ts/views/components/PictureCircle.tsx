
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
  View, Platform
} from "react-native";

import { IconCircle }  from './IconCircle'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { xUtil } from "../../util/StandAloneUtil";

import ImagePicker, { launchImageLibrary } from "react-native-image-picker";
import { CameraOptions } from "react-native-image-picker/src/types";
import { core } from "../../Core";
import { launchCamera } from "react-native-image-picker/src/index";

export class PictureCircle extends Component<any, any> {
  triggerOptions() {
    if (this.props.customPictureSelector !== undefined) {
      this.props.customPictureSelector();
      return;
    }
    SelectPicture((uri) => { this.props.callback(uri); })
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
                lang("_Delete_this_picture__arg_body"),
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

export function SelectPicture(callback) {
  core.eventBus.emit("showPopup", {buttons: [
    {text: lang("Camera"), callback: () => {
      setTimeout(() => {
        launchCamera({ saveToPhotos: false, mediaType: "photo"}, (response) => {
          // console.log('Response = ', response);

          if (response.didCancel) { console.log('User cancelled image picker'); }
          else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorCode);
            if (response.errorCode === 'permission') {
              Alert.alert(lang("Permission_denied"), lang("I_need_permission_to_use_"),[{text:lang("OK")}])
            }
          }
          else {
            callback(response.assets[0].uri)
          }
        });
      }, 100);
    }},
    {text: lang("Photo_Library"),  callback: () => {
      setTimeout(() => {
        launchImageLibrary({ mediaType: "photo", selectionLimit: 1 }, (response) => {
          // console.log('Response = ', response);

          if (response.didCancel) {
            console.log('User cancelled image picker');
          }
          else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorCode);
            if (response.errorCode === 'permission') {
              Alert.alert(lang("Permission_denied"), lang("I_need_permission_to_use_"),[{text:lang("OK")}])
            }
          }
          else {
            callback(response.assets[0].uri)
          }
        });
      }, 100);
    }},
  ]})
}
