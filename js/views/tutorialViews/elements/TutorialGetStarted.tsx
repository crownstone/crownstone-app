
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TutorialGetStarted", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';


import {colors, screenWidth, screenHeight} from '../../styles'
import {Icon} from "../../components/Icon";


export class TutorialGetStarted extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{ lang("Let_s_get_started_") }</Text>
        <View style={{flex:1}} />
        <Icon
          name="c2-crownstone"
          size={0.25*screenHeight}
          color={colors.white.hex}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{ lang("In_this_introduction_we_w") }</Text>
        <View style={{flex:2}} />
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});