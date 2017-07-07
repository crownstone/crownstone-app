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


export class NewDeviceUIGraph extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:45, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>You can now see a running graph of the power usage of a Crownstone. Scroll down for more.</Text>
            <Image source={require('../../../../images/whatsNew/powerUsageGraph.png')} style={{width:602*size, height:968*size}}/>
            <Text style={WNStyles.detail}>{
              "You access it by swiping left on the new Crownstone UI.\n\nThis graph is a preview of what we've been working on. " +
              "In future versions you'll be able to navigate it freely, as well as having one overview for the entire Sphere."
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


