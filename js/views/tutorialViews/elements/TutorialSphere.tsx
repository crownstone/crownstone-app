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


export class TutorialSphere extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>Spheres</Text>
            <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-sphere"
            size={0.15*screenHeight}
            color={colors.white.hex}
          />
            <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{'Your sphere is your collection of Crownstones. This is usually your house, office or personal space.' +
          '\n\nOnly one sphere can be active at a time. It contains rooms, Crownstones, device types and possibly other users.' +
          '\n\nYou can invite other people (as admins, members or guests) to your sphere so they can use your Crownstones.'}</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}
