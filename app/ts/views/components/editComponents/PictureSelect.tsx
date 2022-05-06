
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';


import {menuStyles, styles} from '../../styles'
import {PicturePreview} from "../PicturePreview";

export class PictureSelect extends Component<any, any> {
  render() {
      return (
        <View style={{flex:1}}>
          <View style={[menuStyles.listView, { alignItems:'flex-start', paddingVertical:15}]}>
            <Text style={[menuStyles.listText,{height: undefined}]}>{this.props.label}</Text>
            <PicturePreview {...this.props} />
          </View>
        </View>
      );
  }
}
