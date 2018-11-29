
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Dimmer", key)(a,b,c,d,e);
}
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


export class Dimmer extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Dimmer_is_Here_") }</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/dimmer.png')} style={{width:602*size, height:957*size}} />
            <Text style={[WNStyles.detail,{fontWeight:'bold'}]}>{ lang("You_can_enable_dimming_pe") }</Text>
            <Text style={WNStyles.detail}>{ lang("Set_the_mood_just_right__") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


