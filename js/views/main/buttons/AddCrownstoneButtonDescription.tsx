
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddCrownstoneButtonDescription", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { HiddenFadeInView } from "../../components/animated/FadeInView";
import { xUtil } from "../../../util/StandAloneUtil";


export class AddCrownstoneButtonDescription extends Component<any, any> {
  render() {
    let fontSize = 18;
    if (xUtil.narrowScreen()) { fontSize = 17; }


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
        backgroundColor: colors.white.rgba(0.7),
      }}>
        <View style={{flex:1}} />
        <Text style={{fontSize: fontSize, fontWeight:'bold', color: colors.green.hex}}>{ lang("Add_Crownstones_now_") }</Text>
        { xUtil.narrowScreen() === false ? <Icon name={"md-arrow-round-forward"}  size={20} color={colors.green.hex} style={{padding:5}} /> : undefined }
        <Icon name={"md-arrow-round-forward"}  size={20} color={colors.menuTextSelected.blend(colors.green, 0.5).hex} style={{padding:5}} />
        <Icon name={"md-arrow-round-forward"}  size={20} color={colors.menuTextSelected.hex} style={{padding:5}} />
        <View style={{width:5}} />
        <View style={{width:outerRadius,height: outerRadius}} />
    </HiddenFadeInView>
  );
  }
}
