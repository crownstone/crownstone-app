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

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import {IconButton} from "../../components/IconButton";
import {eventBus} from "../../../util/EventBus";
import {Icon} from "../../components/Icon";


export class TutorialGetStarted extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{'Let\'s get started!'}</Text>
        <View style={{flex:1}} />
        <Icon
          name="c2-crownstone"
          size={0.25*screenHeight}
          color={colors.white.hex}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{'In this small introduction we will explain the basics like spheres, behaviour and permissions.' +
        '\n\nSwipe this screen to the left to get a brief introduction of the features!'}</Text>
        <View style={{flex:2}} />
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});