
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_explanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView
} from "react-native";



import {styles, colors, screenWidth, } from '../../styles'
import { Icon } from '../../components/Icon';

export class RoomTraining_explanation extends Component<any, any> {
  render() {
    return (
      <ScrollView contentContainerStyle={{flexGrow:1}}>
        <View style={{flexDirection:'column', flex:1, padding:20, paddingTop: 30, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'bold',
            color: colors.csBlueDark.hex,
            textAlign:'center'
          }}>{ lang("OK__so_its_a__room__Lets_",this.props.roomSize,this.props.roomName) }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            color: colors.csBlueDark.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{ lang("Walk_around_the_room_with",this.props.sampleSize) }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            color: colors.csBlueDark.hex,
            textAlign:'center',
            paddingTop:20,
            paddingBottom:20,
          }}>{ lang("Press_the_button_below_to") }</Text>

          <View style={{flex:1}} />
          <TouchableOpacity
            style={[{borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}, styles.centered]}
            onPress={() => { this.props.next() }}
          >
            <Icon name="c1-locationPin1" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </ScrollView>
    );
  }
}