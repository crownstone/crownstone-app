
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NewScheduler", key)(a,b,c,d,e);
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


export class NewScheduler extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("You_can_tell_the_Crownsto") }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.0/scheduler.png')} style={{width:556*size, height:820*size}}/>
            <Text style={WNStyles.detail}>{ lang("In_order_to_use_the_sched") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


