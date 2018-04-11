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


export class Locking extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 9*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>Lock your Crownstones!</Text>
            <Image source={require('../../../../images/whatsNew/2.0.0/locking.png')} style={{width:593*size, height:839*size}} />
            <Text style={[WNStyles.detail,{fontWeight:'bold'}]}>You can lock a Crownstone if you want to be sure it won't be switched.</Text>
            <Text style={WNStyles.detail}>Useful for a fridge, pc and more!</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


