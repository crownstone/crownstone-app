
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AutomaticRecentering", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class AutomaticRecentering extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <Text style={WNStyles.text}>{ lang("If_you_scroll_too_far_in_") }</Text>
        <View style={{flex:1}} />
        <Image source={require('../../../../images/whatsNew/1.10.2/automaticRecenter.png')} style={{width:602*size, height:630*size}} />
        <View style={{flex:1}} />
      </View>
    );
  }
}


