
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DimmerButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

import { colors, screenWidth, styles } from "../styles";

export class DimmerSlider extends Component<any, any> {

  render() {
    return (
      <View>
        <View style={{height:50, width:screenWidth-50, backgroundColor: colors.white.rgba(1), borderRadius: 25}}></View>
        <View style={{position:'absolute', left:screenWidth-160, top: -10, height:70, width:70, borderRadius:35, backgroundColor: colors.csBlueDark.rgba(1), ...styles.centered}}>
          <View style={{width:65, height:65, backgroundColor: colors.white.hex, borderRadius: 33, ...styles.centered}}>
            <View style={{width:60, height:60, backgroundColor: colors.csBlueDark.blend(colors.green,0.7).hex, borderRadius: 30, ...styles.centered}}>
              <Text style={{color: colors.white.hex, fontSize: 18, fontWeight:'bold'}}>70%</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}