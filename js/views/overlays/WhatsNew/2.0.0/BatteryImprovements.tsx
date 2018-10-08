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


export class BatteryImprovements extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 12*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ Languages.text("BatteryImprovements", "Battery_Improvements_")() }</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/batteryImprovements.png')} style={{width:539*size, height:543*size}} />
            <Text style={WNStyles.detail}>{ Languages.text("BatteryImprovements", "The_Crownstone_app_will_n")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


