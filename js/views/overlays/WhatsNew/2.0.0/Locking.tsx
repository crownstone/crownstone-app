
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Locking", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {screenWidth} from "../../../styles";
import {WNStyles} from "../WhatsNewStyles";


export class Locking extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Lock_your_Crownstones_") }</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/locking.png')} style={{width:593*size, height:839*size}} />
            <Text style={[WNStyles.detail,{fontWeight:'bold'}]}>{ lang("You_can_lock_a_Crownstone") }</Text>
            <Text style={WNStyles.detail}>{ lang("Useful_for_a_fridge__pc_a") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


