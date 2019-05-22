
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Splash", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View, TextStyle
} from "react-native";
import { Background } from './../components/Background'
import { colors} from './../styles'

import DeviceInfo from 'react-native-device-info';
import { core } from "../../core";

let versionStyle : TextStyle = {
  backgroundColor:"transparent",
  color: colors.white.rgba(0.4),
  fontWeight:'300',
  fontSize: 10,
};

export class Splash extends Component<any, any> {
  render() {
    let factor = 0.25;

    return (
      <Background fullScreen={true} image={core.background.mainDark} shadedStatusBar={true} safeView={true} hideOrangeBar={true}>
        <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', flex: 1}}>
          <View style={{flex:0.5}} />
          <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
          <View style={{flex:2}} />
          <Text style={versionStyle}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
          <View style={{flex:0.5}} />
        </View>
      </Background>
    )
  }
}