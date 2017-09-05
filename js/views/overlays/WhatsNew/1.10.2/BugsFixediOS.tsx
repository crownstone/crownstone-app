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


export class BugsFixediOS extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:45, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Many other issues have been addressed:</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/1.10.2/bugsFixed.png')} style={{width:479*size, height:480*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "- You can invite members and guests to your Sphere without them getting errors." +
              "\n\n- Battery saving improved when not using localization." +
              "\n\n- Fixed issue where the app would show not in Sphere while being in range of your Crownstones." +
              "\n\n- Animated user moving from room to room, fixing user showing up in multiple rooms."
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


