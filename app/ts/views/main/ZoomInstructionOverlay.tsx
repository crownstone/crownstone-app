
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("ZoomInstructionOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  View
} from 'react-native';
import {colors, screenWidth, styles} from "../styles";
import { core } from "../../core";



export class ZoomInstructionOverlay extends Component<any, any> {

  render() {
    let factor = 0.0001*screenWidth;
    let size = 8*factor;

    return (
      <View style={WNStyles.innerScrollView}>
        <Text style={{
          fontSize: 17,
          fontWeight:'bold',
          backgroundColor:'transparent',
          color:colors.csBlue.hex,
          textAlign:'center',
          paddingLeft:10,
          paddingRight:10,
          marginTop:25,
          marginBottom:25,
          overflow:'hidden'
        }}>{ lang("You_can_go_to_the_sphere_") }</Text>
        <View style={{flex:1, minHeight:30}} />
        <Image source={require('../../../assets/images/tutorial/zoomForSphereOverview.png')} style={{width:564*size, height:851*size}} />
        <View style={{flex:1, minHeight:30}} />
        <Text style={WNStyles.detail}>{ lang("Youll_have_to_do_this_onc") }</Text>
        <View style={{flex:1, minHeight:30}} />
        <TouchableOpacity
          onPress={() => { core.eventBus.emit("hideCustomOverlay") }}
          style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue3.rgba(0.5),
          }]}
        >
          <Text style={{fontSize: 15, color: colors.blue3.hex}}>{ lang("Ill_try_it_") }</Text>
        </TouchableOpacity>
        <View style={{height:15}} />
      </View>
    );
  }

}

export const WNStyles = StyleSheet.create({
  detail: {
    fontSize: 13,
    color: colors.csBlue.rgba(0.75),
    textAlign:'center'
  },
  innerScrollView: {
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  outerScrollView: {
  },
});
