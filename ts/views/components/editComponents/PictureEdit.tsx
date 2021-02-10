
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PictureEdit", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';


import { PictureCircle }  from '../PictureCircle'
import { styles} from '../../styles'

export class PictureEdit extends Component<any, any> {
  render() {
      return (
        <View style={{flex:1}}>
          <View style={[styles.listView, { justifyContent:'flex-start', alignItems:'center', height:this.props.barHeightLarge}]}>
            <Text style={[styles.listText,{height:this.props.barHeightLarge - 20}]}>{this.props.label}</Text>
            <PictureCircle {...this.props} />
          </View>
        </View>
      );
  }
}
