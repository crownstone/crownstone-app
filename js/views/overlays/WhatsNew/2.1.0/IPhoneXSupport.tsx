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


export class IPhoneXSupport extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ Languages.text("IPhoneXSupport", "iPhone_X_support_")() }</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/iphoneXSupport.png')} style={{width:602*size, height:968*size, marginTop:10, marginBottom: 10}} />
            <Text style={WNStyles.detail}>{ Languages.text("IPhoneXSupport", "Enjoy_the_Crownstone_app_")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


