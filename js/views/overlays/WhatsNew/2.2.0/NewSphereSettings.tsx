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


export class NewSphereSettings extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>New Sphere menu!</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/newSphereMenu.png')} style={{width:602*size, height:968*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "Press Edit in the top left corner of the Sphere overview, to customize your Sphere!\n\n"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


