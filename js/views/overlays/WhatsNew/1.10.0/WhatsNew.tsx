import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { availableScreenHeight, colors, screenWidth } from "../../../styles";
import { WNStyles } from "../WhatsNewStyles";


export class WhatsNew extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 7*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <View style={{flex:0.5}} />
        <Text style={WNStyles.text}>One of the new things is the What's New popup!</Text>
        <View style={{flex:1}} />
        <Image source={require('../../../../images/whatsNew/1.10.0/swipeLeft.png')} style={{width:567*size, height:604*size}}/>
        <View style={{flex:1}} />
        <Text style={WNStyles.text}>Swipe left to see more of the new features.</Text>
      </View>
    );
  }
}


