
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { HiddenFadeInView } from "../../components/animated/FadeInView";


export class AddSetupStoneButtonDescription extends Component<any, any> {
  render() {
    let outerRadius = 0.15*screenWidth;
    return (
      <HiddenFadeInView
        visible={this.props.visible}
        style={{
        position:'absolute',
        bottom: 6,
        right: 0,
        width: screenWidth,
        height: outerRadius,
        flexDirection:'row',
        alignItems:'center',
        padding:6,
        justifyContent:'center',
        backgroundColor: colors.white.rgba(0.5),
      }}>
        <View style={{flex:1}} />
        <Text style={{fontSize: 17, fontWeight:'bold', color: colors.menuTextSelected.hex}}>New Crownstone Detected</Text>
        <Icon name={"md-arrow-round-forward"}  size={20} color={colors.menuTextSelected.hex} style={{padding:5}} />
        <Icon name={"md-arrow-round-forward"}  size={20} color={colors.menuTextSelected.hex} style={{padding:5}} />
        <View style={{width:5}} />
        <View style={{width:outerRadius,height: outerRadius}} />
    </HiddenFadeInView>
  );
  }
}
