
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Awesome", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, screenWidth, styles} from "../../styles";
import {Icon} from "../../components/Icon";
import {ProgressCircle} from "../../components/ProgressCircle";
import {WNStyles} from "./WhatsNewStyles";


export class Awesome extends Component<any, any> {
  render() {
    let radius = 0.20*screenWidth;
    return (
      <View style={{flex:1, paddingBottom:45, padding:10, alignItems:'center', justifyContent:'center'}}>
        <View style={{flex:0.5}} />
        <Text style={WNStyles.text}>{ lang("Thats_it_for_this_update_") }</Text>
        <View style={{flex:0.5}} />
        <TouchableOpacity
          onPress={() => { this.props.closeCallback(); }}
          style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
          <ProgressCircle
            radius={radius}
            borderWidth={0.25*radius}
            progress={1}
            color={colors.green.hex}
            absolute={true}
          />
          <Icon name="md-checkmark" size={radius} color={colors.green.hex} style={{position:'relative', left:0, top:0.05*radius}} />
        </TouchableOpacity>
        <View style={{flex:0.5}} />
        <Text style={WNStyles.text}>{ lang("Enjoy_the_new_version_") }</Text>
        <View style={{flex:1}} />
        <TouchableOpacity
          onPress={() => { this.props.closeCallback(); }}
          style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue.rgba(0.5),
          }]}
        >
          <Text style={{fontSize: 14, color: colors.blue.hex}}>{ lang("Thanks_") }</Text>
        </TouchableOpacity>
        <View style={{flex:0.5}} />
      </View>
    );
  }
}
