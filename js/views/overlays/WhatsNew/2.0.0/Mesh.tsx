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
            <Text style={WNStyles.text}>{"Crownstones now Mesh!\nLet the gossip begin!"}</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/mesh.png')} style={{width:480*size, height:774*size, marginTop:30, marginBottom:30}} />
            <Text style={WNStyles.detail}>{"Your Crownstones can now talk to each other.\n\n" +
            "This feature extends your overall range, improves the ENTER/EXIT Sphere reliability and allows you to switch many Crownstones much faster!"}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


