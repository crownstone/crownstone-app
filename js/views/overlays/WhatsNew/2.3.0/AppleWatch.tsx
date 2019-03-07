
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AppleWatch", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class AppleWatch extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Apple_Watch_") }</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.3.0/appleWatch.png')} style={{width:375*size, height:640*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ lang("Quickly_scan_for_nearby_Cr") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


