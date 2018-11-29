
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Switchcraft", key)(a,b,c,d,e);
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


export class Switchcraft extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("Introducing___") }</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/switchcraft.png')} style={{width:602*size, height:844*size, marginTop:10, marginBottom: 30}} />
            <Text style={WNStyles.detail}>{ lang("Switchcraft_allows_you_to") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


