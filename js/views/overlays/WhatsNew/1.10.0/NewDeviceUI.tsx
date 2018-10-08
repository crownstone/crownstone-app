import { Languages } from "../../../../Languages"
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
            <Text style={WNStyles.text}>{ Languages.text("NewDeviceUI", "The_Crownstone_settings_h")() }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.0/newDeviceUI.png')} style={{width:556*size, height:924*size}}/>
            <Text style={WNStyles.detail}>{ Languages.text("NewDeviceUI", "You_get_there_by_tapping_")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


