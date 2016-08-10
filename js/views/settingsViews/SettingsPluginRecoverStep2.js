import React, { Component } from 'react'
import {
  ActivityIndicatorIOS,
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

import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle, CancelButton, NextButton } from '../setupViews/SetupShared'
import { styles, colors, width, height } from './../styles'

export class SettingsPluginRecoverStep2 extends Component {
  render() {
    let imageSize = 0.45;
    return (
      <Background hideTabBar={true} background={require('../../images/mainBackgroundLight.png')}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.menuBackground.hex}]}>Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.menuBackground.hex}]}>Trying to recover the nearest Crownstone...</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugDark.png')} style={{width:imageSize*height, height:imageSize*height}} />
          </View>
          <View style={{flex:1}} />
          <View style={{marginBottom:20}}>
            <ActivityIndicatorIOS animating={true} size="large"/>
          </View>

        </View>
      </Background>
    )
  }
}

