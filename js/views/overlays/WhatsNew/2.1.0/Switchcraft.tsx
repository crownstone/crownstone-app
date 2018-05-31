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


export class Switchcraft extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 12*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Introducing...</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/switchcraft.png')} style={{width:602*size, height:794*size, marginTop:10, marginBottom: 30}} />
            <Text style={WNStyles.detail}>{
              "Switchcraft means you can use most wall switches with your built-in Crownstones. " +
              "If the Crownstone is connected to a ceiling light, you can modify your wall switch a little to use it with the Crownstone.\n\n" +
              "We have tested this feature a lot and are happy with the results so far! Since we can't test all possible wall switches, Switchcraft is " +
              "first released as a beta feature. Go to 'My Account' and select 'Join Beta Program' to enable the Switchcraft option for built-in Crownstones!"
            }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


