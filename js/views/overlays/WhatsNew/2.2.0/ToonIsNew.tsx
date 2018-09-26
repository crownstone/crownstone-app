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


export class ToonIsNew extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Integation with Toon!</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/Toon.png')} style={{width:592*size, height:742*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "Sometimes, Toon is set to \"Away\" while you're still there...\n\n" +
              "...but Crownstone can set it to \"Home\" as long as you're home!\n\n" +
              "Let this phone tell Toon when it's home!\n\n\n"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


