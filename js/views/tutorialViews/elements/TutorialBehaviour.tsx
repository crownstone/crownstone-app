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

import {styles, colors, screenWidth, screenHeight, availableScreenHeight, topBarHeight} from '../../styles'
import {Icon} from "../../components/Icon";
import {tutorialStyle} from "../Tutorial";


export class TutorialBehaviour extends Component<any, any> {
  render() {
    return (
      <ScrollView style={{height: screenHeight - topBarHeight, width: screenWidth}}>
        <View style={{flex:1, alignItems:'center', padding: 30}}>
          <Text style={tutorialStyle.header}>Behaviour</Text>
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Icon
            name="c1-brain"
            size={0.18*screenHeight}
            color={colors.white.hex}
          />
          <View style={{width: screenWidth, height: 0.06*screenHeight}} />
          <Text style={tutorialStyle.text}>{'Behaviour of Crownstones indicates how it responds to your location.' +
          '\n\nYou can tell the Crownstone to turn on or off when you... ' +
          '\n\n- Enter or exit the sphere.' +
          '\n- Get near or move away from it.' +
          '\n- Enter or exit a room (with 4 or more).'}</Text>
          <View style={{width: screenWidth, height: 0.12*screenHeight}} />
        </View>
      </ScrollView>
    )
  }
}