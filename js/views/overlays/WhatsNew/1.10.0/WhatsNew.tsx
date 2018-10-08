import { Languages } from "../../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { screenWidth } from "../../../styles";
import { WNStyles } from "../WhatsNewStyles";


export class WhatsNew extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 7*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <View style={{flex:0.5}} />
        <Text style={WNStyles.text}>{ Languages.text("WhatsNew", "One_of_the_new_things_is_")() }</Text>
        <View style={{flex:1}} />
        <Image source={require('../../../../images/whatsNew/1.10.0/swipeLeft.png')} style={{width:567*size, height:604*size}}/>
        <View style={{flex:1}} />
        <Text style={WNStyles.text}>{ Languages.text("WhatsNew", "Swipe_left_to_see_more_of")() }</Text>
      </View>
    );
  }
}


