
import { Languages } from "../../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_CreateNewBehaviour", key)(a,b,c,d,e);
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
  screenWidth} from "../../../../styles";
import { Background } from "../../../../components/Background";
import { core } from "../../../../../core";
import { TopBarUtil } from "../../../../../util/TopBarUtil";

export class DeviceSmartBehaviour_CreateNewBehaviour extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("A_Crownstone")});
  }


  render() {
    let iconHeight = 0.10*availableScreenHeight;
    let bubbleStyle : ViewStyle = {width: 0.40*screenWidth, height:70, borderRadius:30, backgroundColor: colors.white.rgba(0.4), alignItems:'center', justifyContent: 'center'};
    let bubbleTextStyle : TextStyle = {color: colors.white.hex, padding:10, textAlign:'center'};

    return (
      <Background image={core.background.detailsDark}>
        <View style={{ width: screenWidth, height:availableScreenHeight, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ lang("Presence_Aware") }</Text>
          <View style={{height: 0.2*iconHeight}} />
          <Text style={deviceStyles.specification}>{ lang("Ill_be_ON_when___") }</Text>
          <View style={{height: 0.2*iconHeight}} />
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>{ lang("____somebody_is_home____") }</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>{ lang("____nobody_is_home____") }</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>{ lang("____there_are_people_certa") }</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>{ lang("____a_certain_room_is_empt") }</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flexDirection:'row', padding:10}}>
            <View style={{flex:1}} />
            <TouchableOpacity style={bubbleStyle}>
              <Text style={bubbleTextStyle}>{ lang("____someone_is_near_me____") }</Text>
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
          <View style={{flex:1}} />
          <Text style={bubbleTextStyle}>{ lang("Pick_one_to_continue_") }</Text>
        </View>
      </Background>
    )
  }
}
