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


export class FastSetup extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 11*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Image source={require('../../../../images/whatsNew/2.1.0/fastSetup.png')} style={{width:475*size, height:571*size, marginTop:15, marginBottom: 25}} />
            <Text style={WNStyles.detail}>By speeding up the setup process in the new 2.1.2 firmware, we’ve fixed issues with certain android phones.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


