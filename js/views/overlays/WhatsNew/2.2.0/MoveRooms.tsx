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


export class MoveRooms extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Customize where your rooms are!</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/roomPositions.png')} style={{width:560*size, height:744*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "You can now choose where you want your rooms to be placed!\n\n" +
              "You can find this in the new Sphere menu, under rooms!\n\n"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


