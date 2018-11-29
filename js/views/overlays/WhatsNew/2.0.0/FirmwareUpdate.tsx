
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("FirmwareUpdate", key)(a,b,c,d,e);
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


export class FirmwareUpdate extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ lang("New_firmware_available_") }</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/firmwareUpdate.png')} style={{width:566*size, height:909*size}} />
            <Text style={WNStyles.detail}>{ lang("The_new_firmware_enables_") }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


