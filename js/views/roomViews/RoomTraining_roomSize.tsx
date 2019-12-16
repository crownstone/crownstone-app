
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomTraining_roomSize", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ViewStyle, TextStyle
} from "react-native";



import { Background }   from '../components/Background'
import {colors, screenWidth, screenHeight, } from '../styles'
import { Icon }         from '../components/Icon';
import { Util }         from "../../util/Util";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";


let buttonTextStyle : TextStyle = {
  backgroundColor:'transparent',
  fontSize:15,
  fontWeight:'bold',
  color: colors.white.hex,
  textAlign:'left',
};
let squareMeterStyle : TextStyle = {
  ...buttonTextStyle,
  position:'relative',
  top:-2,
  fontSize:12,
};

let buttonStyle : ViewStyle = {
  backgroundColor: colors.menuTextSelected.rgba(0.6),
  borderRadius: 30,
  width: 0.95*screenWidth,
  height: 0.12*screenHeight,
  flexDirection:'row',
  alignItems:'center'
};

let iconContainerStyle : ViewStyle = {
  width:0.3*screenWidth,
  alignItems:'center'
};

let textContainerStyle : ViewStyle = {
  flexDirection:'row',
  width:0.7*screenWidth,
  paddingLeft: 10
};

export class RoomTraining_roomSize extends LiveComponent<any, any> {
  static options(props) {
    let ai = Util.data.getAiName(core.store.getState(), props.sphereId);
    return TopBarUtil.getOptions({title:  lang("Teaching_",ai), closeModal: true});
  }

  _getButton(sampleSize, iconSize, text, roomSize) {
    return (
      <TouchableOpacity style={buttonStyle} onPress={() => { NavigationUtil.navigate( "RoomTraining",{sphereId: this.props.sphereId, locationId: this.props.locationId, sampleSize: sampleSize, roomSize: roomSize}) }}>
        <View style={iconContainerStyle}>
          <Icon name="md-cube" size={iconSize} color={colors.green.hex} style={{backgroundColor:"transparent"}} />
        </View>
        <View style={textContainerStyle}>
          <Text style={buttonTextStyle}>{text}</Text>
          <Text style={squareMeterStyle}>2</Text>
          <Text style={buttonTextStyle}>)</Text>
        </View>
      </TouchableOpacity>
    );
  }

  render() {
    let roomName = 'this room';

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (sphere) {
      let location = sphere.locations[this.props.locationId];
      if (location) {
        roomName = location.config.name || roomName;
      }
    }

    return (
      <Background hasNavBar={false} image={core.background.light}>
        <View style={{flexDirection:'column', flex:1, padding:20, paddingTop: 30, alignItems:'center'}}>
          <Text style={{
            backgroundColor:'transparent',
            fontSize:20,
            fontWeight:'bold',
            color: colors.csBlueDark.hex,
            textAlign:'center'
          }}>{ lang("To_let__find_you_in___we_",roomName) }</Text>

          <View style={{flex:2}} />
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            fontWeight:'bold',
            color: colors.csBlueDark.hex,
            textAlign:'center',
          }}>{ lang("How_large_is_this_room_") }</Text>

          <View style={{flex:1}} />
          <Text style={{
            backgroundColor:'transparent',
            fontSize:16,
            color: colors.csBlueDark.hex,
            textAlign:'center',
          }}>{ lang("Large_rooms_take_a_bit_mo") }</Text>

          <View style={{flex:3}} />
          {this._getButton(30, Math.min(0.06*screenHeight,0.10*screenWidth), 'Normal (up to 20 m', "small")}
          <View style={{flex:1}} />
          {this._getButton(60, Math.min(0.08*screenHeight,0.15*screenWidth), 'Big (up to 50 m', "medium sized")}
          <View style={{flex:1}} />
          {this._getButton(90, Math.min(0.10*screenHeight,0.20*screenWidth), 'Huge (more than 50 m', "large")}
          <View style={{flex:2}} />
        </View>
      </Background>
    );
  }
}


