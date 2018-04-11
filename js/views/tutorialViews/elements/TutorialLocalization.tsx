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
import {tutorialStyle} from "../Tutorial";


export class TutorialLocalization extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>Indoor Localization</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-mapPin"
            size={0.18*screenHeight}
            color={colors.white.hex}
          />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{'Your phone can determine how far it is from every Crownstone.' +
          '\n\nIf you have 4 or more Crownstones, this information can be combined to determine in which room you are.' +
          '\n\nWe are only using the Bluetooth iBeacon messages sent from the Crownstones, not your GPS. For this, we require the background location permissions.'}</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}