
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, ViewStyle, TextStyle
} from "react-native";


import {
  availableScreenHeight,
  colors,
  deviceStyles,
  OrangeLine,
  screenWidth} from "../../../styles";
import { Background } from "../../../components/Background";
import { core } from "../../../../core";

export class DeviceSmartBehaviour_CreateNewBehaviour extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };


  render() {
    let iconHeight = 0.10*availableScreenHeight;
    let bubbleStyle : ViewStyle = {width: 0.40*screenWidth, height:70, borderRadius:30, backgroundColor: colors.white.rgba(0.4), alignItems:'center', justifyContent: 'center'};
    let bubbleTextStyle : TextStyle = {color: colors.white.hex, padding:10, textAlign:'center'};

    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <View style={{ width: screenWidth, height:availableScreenHeight, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ "Presence Aware" }</Text>
          <View style={{height: 0.2*iconHeight}} />
          <Text style={deviceStyles.specification}>{"I'll be ON when..."}</Text>
          <View style={{height: 0.2*iconHeight}} />
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>... somebody is home ...</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>... nobody is home ...</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>... there are people certain room(s) ...</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>... a certain room is empty ...</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>... someone is near me ...</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flex:1}} />
          <Text style={bubbleTextStyle}>Pick one to continue!</Text>
        </View>
      </Background>
    )
  }
}
