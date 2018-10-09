
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TimezoneScheduler", key)(a,b,c,d,e);
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


export class TimezoneScheduler extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Schedules_now_support_day") }</Text>
            <View style={{height:30}} />
            <Text style={WNStyles.important}>{ lang("IMPORTANT__ALL_EXISTING_S") }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.2/timezoneSchedule.png')} style={{width:544*size, height:750*size}} />
            <Text style={WNStyles.detail}>{ lang("_______________Because_th") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


