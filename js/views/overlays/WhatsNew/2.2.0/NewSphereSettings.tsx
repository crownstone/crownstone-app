
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("NewSphereSettings", key)(a,b,c,d,e);
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


export class NewSphereSettings extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("New_Sphere_menu_") }</Text>
            <View style={{height:30}} />
            <Image source={require('../../../../images/whatsNew/2.2.0/newSphereMenu.png')} style={{width:602*size, height:968*size}} />
            <View style={{height:30}} />
            <Text style={WNStyles.detail}>{ lang("Press_Edit_in_the_top_rig") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


