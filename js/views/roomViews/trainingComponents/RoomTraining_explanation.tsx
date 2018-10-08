import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, OrangeLine} from '../../styles'
import { Icon } from '../../components/Icon';

export class RoomTraining_explanation extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1}}>
        <OrangeLine/>
        <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'600',
            color: colors.white.hex,
            textAlign:'center'
          }}>{ Languages.text("RoomTraining_explanation", "OK__so_its_a__room__Lets_")(this.props.roomSize,this.props.roomName) }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
          }}>{ Languages.text("RoomTraining_explanation", "Walk_around_the_room_with")(this.props.sampleSize) }</Text>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'300',
            color: colors.white.hex,
            textAlign:'center',
            paddingTop:20,
            paddingBottom:20,
          }}>{ Languages.text("RoomTraining_explanation", "Press_the_button_below_to")() }</Text>

          <View style={{flex:1}} />
          <TouchableOpacity
            style={[{borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}, styles.centered]}
            onPress={() => { this.props.next() }}
          >
            <Icon name="c1-locationPin1" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </View>
    );
  }
}