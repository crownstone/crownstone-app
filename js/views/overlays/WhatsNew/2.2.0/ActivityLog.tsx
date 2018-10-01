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


export class ActivityLog extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Activity Log!</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/activityLogs.png')} style={{width:602*size, height:968*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{
              "Ever wonder why a Crownstone switched? Why is it on?\n\n" +
              "In the new Activity Log, you can see exactly why this is!\n\n" +
              "You can find the new log in the Crownstone settings (by tapping on a Crownstone icon in a room) and navigating to the right.\n\n"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


