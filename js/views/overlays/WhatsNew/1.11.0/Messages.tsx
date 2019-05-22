
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Messages", key)(a,b,c,d,e);
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


export class Messages extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 14*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("You_can_now_leave_a_messa") }</Text>
            <Image source={require('../../../../images/whatsNew/1.11.0/messages.png')} style={{width:489*size, height:593*size}} />
            <Text style={WNStyles.detail}>{ lang("Its_like_you_leave_a_digi") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


