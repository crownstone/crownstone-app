
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CancelButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';

import { colors, topBarHeight, statusBarHeight} from '../../styles'
import {topBarStyle} from "./TopbarStyles";

let barHeight = topBarHeight - statusBarHeight;


export class CancelButton extends Component<any, any> {

  render() {
    return (
      <TouchableOpacity onPress={() => { this.props.onPress();}}  style={topBarStyle.topBarLeftTouch}>
        <View style={{flexDirection:'row', alignItems:'center', justifyContent:'flex-start', flex:0, height: barHeight}}>
          <Text style={[topBarStyle.topBarLeft, topBarStyle.text, {color: colors.white.hex}]}>{ lang("Cancel") }</Text>
        </View>
      </TouchableOpacity>
    );
  }
}

