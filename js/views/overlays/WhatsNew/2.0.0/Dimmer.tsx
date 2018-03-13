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


export class Dimmer extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Dimmer is Here!</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/dimmer.png')} style={{width:602*size, height:957*size}} />
            <Text style={[WNStyles.detail,{fontWeight:'bold'}]}>You can enable dimming per Crownstone in its settings.</Text>
            <Text style={WNStyles.detail}>Set the mood just right! </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


