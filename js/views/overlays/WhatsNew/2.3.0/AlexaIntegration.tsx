
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AlexaIntegration", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {WNStyles} from "../WhatsNewStyles";


export class AlexaIntegration extends Component<any, any> {
  render() {
    let size = 1;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Amazon_Alexa_") }</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/thirdParty/logo/amazonAlexa.png')} style={{width:144*size, height:144*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ lang("Crownstone_is_now_availabl") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


