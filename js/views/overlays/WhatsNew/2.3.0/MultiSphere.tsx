
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("MultiSphere", key)(a,b,c,d,e);
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


export class MultiSphere extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Multiple_Spheres_") }</Text>
            <View style={{height:20}} />
            <Image source={require('../../../../images/whatsNew/2.3.0/multisphere.png')} style={{width:592*size, height:796*size}} />
            <View style={{height:20}} />
            <Text style={WNStyles.detail}>{ lang("You_can_now_create_multipl") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


