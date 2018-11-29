
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SyncingSchedulesToTheCloud", key)(a,b,c,d,e);
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


export class SyncingSchedulesToTheCloud extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Schedules_are_now_synchro") }</Text>
            <View style={{height:15}} />
            <Image source={require('../../../../images/whatsNew/1.11.0/syncSchedules.png')} style={{width:621*size, height:804*size}} />
            <Text style={WNStyles.detail}>{ lang("This_happens_automaticall") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


