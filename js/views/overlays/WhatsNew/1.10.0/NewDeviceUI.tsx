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


export class NewDeviceUI extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>The Crownstone settings have a new UI. You can swipe left and right on it to see the options. Scroll down for more.</Text>
            <Image source={require('../../../../images/whatsNew/1.10.0/newDeviceUI.png')} style={{width:556*size, height:924*size}}/>
            <Text style={WNStyles.detail}>{'You get there by tapping on the Crownstone in the room overview, and pressing \"settings\".' +
            '\n\nIn the new overview, tap on the icon to set the device, swipe left for behaviour and the new power usage graph.'}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


