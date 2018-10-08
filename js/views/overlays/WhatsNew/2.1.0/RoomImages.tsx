import { Languages } from "../../../../Languages"
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


export class RoomImages extends Component<any, any> {
  render() {
    let factor = 0.0001*screenWidth;
    let size = 12*factor;
    return (
      <View style={{flex:1, paddingBottom:0, alignItems:'center', justifyContent:'center'}}>
        <ScrollView style={[WNStyles.outerScrollView,{width: this.props.width}]}>
          <View style={WNStyles.innerScrollView}>
            <Text style={WNStyles.text}>{ Languages.text("RoomImages", "Customize_Rooms_")() }</Text>
            <Image source={require('../../../../images/whatsNew/2.1.0/roomImages.png')} style={{width:557*size, height:639*size, marginTop:10, marginBottom: 20}} />
            <Text style={WNStyles.detail}>{ Languages.text("RoomImages", "If_youre_the_admin_of_you")() }</Text>
          </View>
        </ScrollView>
      </View>
    );
  }
}


