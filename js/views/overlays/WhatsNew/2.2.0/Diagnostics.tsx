import { Languages } from "../../../../Languages"
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
            <Text style={WNStyles.text}>{ Languages.text("Diagnostics", "Crownstone_Diagnostics")() }</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/diagnostics.png')} style={{width:569*size, height:853*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ Languages.text("Diagnostics", "Sometimes__things_dont_se")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


