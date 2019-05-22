
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AndroidLib", key)(a,b,c,d,e);
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


export class AndroidLib extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Brand_new_Android_") }</Text>
            <View style={{height:20}} />
            <Image source={require('../../../../images/whatsNew/2.3.0/androidLib.png')} style={{width:425*size, height:612*size}} />
            <View style={{height:20}} />
            <Text style={WNStyles.detail}>{ lang("Over_the_last_few_months_w") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


