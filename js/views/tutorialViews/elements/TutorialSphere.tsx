
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TutorialSphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {colors, screenWidth, screenHeight, topBarHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import { tutorialStyle } from "../TutorialStyle";


export class TutorialSphere extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>{ lang("Spheres") }</Text>
            <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-sphere"
            size={0.15*screenHeight}
            color={colors.white.hex}
          />
            <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{ lang("Your_sphere_is_your_colle") }</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}
