import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {availableScreenHeight, screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class AutomaticRecentering extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <Text style={WNStyles.text}>If you scroll too far in the Sphere overview, I will now recenter your view and show the double tap shortcut!</Text>
        <View style={{flex:1}} />
        <Image source={require('../../../../images/whatsNew/1.10.2/automaticRecenter.png')} style={{width:602*size, height:630*size}} />
        <View style={{flex:1}} />
      </View>
    );
  }
}


