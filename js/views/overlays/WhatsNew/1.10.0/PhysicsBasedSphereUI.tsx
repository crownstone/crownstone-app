import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {availableScreenHeight, screenWidth} from "../../../styles";
import {WNStyles} from "./WhatsNew";


export class PhysicsBasedSphereUI extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:45, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>The Sphere overview now positions the rooms automatically. Scroll down for more.</Text>
            <View style={{flex:1}} />
            <Image source={require('../../../../images/whatsNew/physicsBasedSphereUI.png')} style={{width:529*size, height:1162*size}}/>
            <View style={{flex:1}} />
            <Text style={WNStyles.detail}>You can move it around as well as zoom in. Double tap the background to reset the camera.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


