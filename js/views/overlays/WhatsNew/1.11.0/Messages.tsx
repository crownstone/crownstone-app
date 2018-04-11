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


export class Messages extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 14*factor;
    return (
      <View style={{flex:1, paddingBottom:0, padding:10, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={{}}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>You can now leave a message for others or yourself!</Text>
            <Image source={require('../../../../images/whatsNew/1.11.0/messages.png')} style={{width:489*size, height:593*size}} />
            <Text style={WNStyles.detail}>It's like you leave a digital sticky note in a room or in a Sphere.</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


