
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Mesh", key)(a,b,c,d,e);
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


export class Mesh extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 8*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Crownstones_now_Mesh__nLe") }</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/mesh.png')} style={{width:480*size, height:774*size, marginTop:30, marginBottom:30}} />
            <Text style={WNStyles.detail}>{ lang("Your_Crownstones_can_now_") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


