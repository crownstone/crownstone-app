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


export class Diagnostics extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Crownstone Diagnostics</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/diagnostics.png')} style={{width:569*size, height:853*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "Sometimes, things don't seem to work as they should...\n\n" +
              "Since everything works via invisible signals, it's difficult to determine what the problem is!\n\n" +
              "The Diagnostics are here to help you discover what the problem could be!\n\n" +
              "You can find them in the settings menu!\n\n"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


