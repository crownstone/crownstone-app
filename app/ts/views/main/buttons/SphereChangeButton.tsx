
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereChangeButton", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  View
} from 'react-native';
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import { HiddenFadeInView } from "../../components/animated/FadeInView";




export class SphereChangeButton extends Component<any, any> {
  render() {
    let outerRadius = 0.11*screenWidth;
    let size = 0.084*screenWidth;
    let color = colors.csBlueDark.rgba(0.75);
    return (
      <HiddenFadeInView
        visible={this.props.visible}
        style={{
          position:'absolute',
          top: 0,
          left: 0,
          padding: 6,
          paddingRight:10,
          paddingBottom:10,
          flexDirection:'row',
          alignItems:'center',
          justifyContent:'center',
        }}>
          <TouchableOpacity onPress={() => { this.props.onPress(); }} testID={"SphereChangeButton"}>
          <View style={{
            width: outerRadius,
            height:outerRadius,
            borderRadius:0.5*outerRadius,
            backgroundColor: colors.white.rgba(0.5),
            alignItems:'center',
            justifyContent:'center',
          }}>
            <Icon name="c1-sphere" size={size} color={ color } />
          </View>
        </TouchableOpacity>
      </HiddenFadeInView>
    );
  }
}