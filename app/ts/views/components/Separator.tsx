
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Separator", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';

import {styles, colors, screenWidth, menuStyles} from '../styles'


export class Separator extends Component<{color?: any, fullLength?: boolean}, any> {
  render() {

    if (this.props.fullLength === true)
      return <View style={[menuStyles.separator,{ backgroundColor: this.props.color ?? menuStyles.separator.backgroundColor }]} />;
    else {
      return (
        <View style={{backgroundColor:'#fff'}}>
          <View style={[menuStyles.separator, {width:screenWidth-15, alignSelf:'flex-end', backgroundColor: this.props.color ?? menuStyles.separator.backgroundColor}]}/>
        </View>
      );
    }
  }
}
