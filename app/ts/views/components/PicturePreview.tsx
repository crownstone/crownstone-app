
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
} from "react-native";

import { IconCircle }  from './IconCircle'
import { Icon } from './Icon';
import { styles, colors} from '../styles'
import { xUtil } from "../../util/StandAloneUtil";
import {SelectPicture} from "./PictureCircle";

export class PicturePreview extends Component<any, any> {
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
      let imageURI = this.props.imageURI ||
                     typeof this.props.value === "number" && this.props.value ||
                     {uri:xUtil.preparePictureURI(this.props.value)};
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
                  {text:lang("_Delete_this_picture__arg_right"), onPress:() => { this.props.removePicture(); }}
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
          }}
          testID={this.props.testID_remove || "PictureCircleRemove"}>
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
          <TouchableOpacity onPress={() => {this.triggerOptions()}} style={{height:size}} testID={this.props.testID || "PictureCircle"}>
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


