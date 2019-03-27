
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("FastSetup", key)(a,b,c,d,e);
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


export class FastSetup extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Image source={require('../../../../images/whatsNew/2.1.0/fastSetup.png')} style={{width:475*size, height:571*size, marginTop:15, marginBottom: 25}} />
            <Text style={WNStyles.detail}>{ lang("By_speeding_up_the_setup_") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


