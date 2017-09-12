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


export class FirmwareUpdateFix extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, padding:10, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={[WNStyles.innerScrollView, {minHeight: 400}]}>
            <Text style={WNStyles.text}>Issues that caused the app to crash when the firmware update was finished are now resolved.</Text>
            <View style={{height:15}} />
            <Image source={require('../../../../images/whatsNew/1.10.2/fixedUpdate.png')} style={{width:511*size, height:666*size}} />
            <View style={{height:15}} />
            <Text style={WNStyles.detail}>You can safely update all Crownstones now :)</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


