
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NewDeviceUIGraph", key)(a,b,c,d,e);
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


export class NewDeviceUIGraph extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("You_can_now_see_a_running") }</Text>
            <Image source={require('../../../../images/whatsNew/1.10.0/powerUsageGraph.png')} style={{width:602*size, height:968*size}}/>
            <Text style={WNStyles.detail}>{ lang("You_access_it_by_swiping_") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


