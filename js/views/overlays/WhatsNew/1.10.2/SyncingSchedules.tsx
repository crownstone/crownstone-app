
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SyncingSchedules", key)(a,b,c,d,e);
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


export class SyncingSchedules extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("You_can_now_download_the_") }</Text>
            <View style={{height:15}} />
            <Text style={WNStyles.important}>{ lang("IMPORTANT__ALL_EXISTING_S") }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.2/syncScheduler.png')} style={{width:602*size, height:821*size}} />
            <Text style={WNStyles.detail}>{ lang("Use_this_to_change_or_del") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


