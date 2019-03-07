
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BatteryImprovements", key)(a,b,c,d,e);
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


export class BatteryImprovements extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Battery_Improvements_") }</Text>
            <View style={{height:40}} />
            <Image source={require('../../../../images/whatsNew/2.3.0/batteryImprovements.png')} style={{width:539*size, height:549*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ lang("The_Crownstone_app_will_n") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


