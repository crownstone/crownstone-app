
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("PhysicsBasedSphereUI", key)(a,b,c,d,e);
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


export class PhysicsBasedSphereUI extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 10*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("The_Sphere_overview_now_p") }</Text>
            <View style={{flex:1}} />
            <Image source={require('../../../../images/whatsNew/1.10.0/physicsBasedSphereUI.png')} style={{width:529*size, height:1162*size}}/>
            <View style={{flex:1}} />
            <Text style={WNStyles.detail}>{ lang("You_can_move_it_around_as") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


