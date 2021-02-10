
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Separator", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';

import { styles, colors, screenWidth } from '../styles'


export class Separator extends Component<any, any> {
  render() {
    let opacity = 1;
    if (this.props.opacity !== undefined && this.props.opacity !== null) {
      opacity = this.props.opacity;
    }
    if (this.props.fullLength === true)
      return <View style={[styles.separator,{ backgroundColor: this.props.color || colors.black.rgba(opacity*0.25) }]} />;
    else {
      return (
        <View style={{backgroundColor:'#fff'}}>
          <View style={[styles.separator, {width:screenWidth-15, alignSelf:'flex-end', backgroundColor: this.props.color || colors.black.rgba(opacity*0.25)}]}/>
        </View>
      );
    }
  }
}
