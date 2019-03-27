
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("BugsFixedAndroid1_10_2", key)(a,b,c,d,e);
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


export class BugsFixedAndroid1102 extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Issues_that_caused_the_ap") }</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/1.10.2/bugsFixed.png')} style={{width:479*size, height:480*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ lang("You_can_safely_update_all") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


