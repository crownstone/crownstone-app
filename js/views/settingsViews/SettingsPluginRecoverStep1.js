import React, { Component } from 'react'
import {
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { setupStyle, NextButton } from './SetupShared'
import { styles, colors, screenWidth, screenHeight } from './../styles'

export class SettingsPluginRecoverStep1 extends Component {
  render() {
    let imageSize = 0.40;
    return (
      <Background hideTabBar={true} image={this.props.backgrounds.main}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.menuBackground.hex}]}>If you're physically next to the Crownstone, you can restore it to factory defaults.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.menuBackground.hex}]}>Please take the Crownstone out of the outlet, wait 5 seconds, and plug it back in. Hold your phone close to it and press Next to continue.</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/pluggingInPlugRetryDark.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <View style={{flex:1}} />
            <NextButton dark={true} onPress={Actions.settingsPluginRecoverStep2} />
          </View>
        </View>
      </Background>
    )
  }
}

