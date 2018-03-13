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


export class FirmwareUpdate extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>New firmware available!</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/firmwareUpdate.png')} style={{width:566*size, height:909*size}} />
            <Text style={WNStyles.detail}>{"The new firmware enables the mesh, the dimmer and it also has a lot of security improvements!\n" +
            "This update is mandatory to make sure everything will work together."}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


