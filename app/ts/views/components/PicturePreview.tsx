
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
import {styles, colors, screenHeight, screenWidth} from '../styles'
import { xUtil } from "../../util/StandAloneUtil";
import {SelectPicture} from "./PictureCircle";
import {EditCornerIcon} from "./IconCircleEdit";

export class PicturePreview extends Component<any, any> {
  triggerOptions() {
    if (this.props.customPictureSelector !== undefined) {
      this.props.customPictureSelector();
      return;
    }
    SelectPicture((uri) => { this.props.callback(uri); })
  }

  render() {
    let size = this.props.size || 70;
    if (this.props.value || this.props.imageURI) {
      let imageURI = this.props.imageURI ||
                     typeof this.props.value === "number" && this.props.value ||
                     {uri:xUtil.preparePictureURI(this.props.value)};

      let borderWidth = this.props.borderWidth || size / 30;
      let innerSize = size - 2*borderWidth;
      let height = (screenHeight/screenWidth) * size;
      return (
        <TouchableOpacity
          onPress={() => {
            this.triggerOptions();
          }}
          style={{
            alignItems:'center',
            justifyContent:'center',
          }}
          testID={this.props.testID_remove || "PictureRemove"}>
            <Image style={{width:innerSize, height:height, borderRadius: 5}} source={imageURI} />
            <EditCornerIcon size={80/3} />
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


