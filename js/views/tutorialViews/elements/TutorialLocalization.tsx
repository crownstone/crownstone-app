
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TutorialLocalization", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


import {colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import { tutorialStyle } from "../TutorialStyle";


export class TutorialLocalization extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>{ lang("Indoor_Localization") }</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-mapPin"
            size={0.18*screenHeight}
            color={colors.white.hex}
          />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ lang("Your_phone_can_determine_") }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}