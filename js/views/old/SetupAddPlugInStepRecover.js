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

import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle, CancelButton, NextButton } from './SetupShared'
import { styles, colors, width, screenHeight } from './../styles'

export class SetupAddPlugInStepRecover extends Component {
  render() {
    let imageSize = 0.35;
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1]}>Let's try again..</Text>
          <Text style={setupStyle.text}>Something went wrong during the setup process.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Please take the Crownstone out of the outlet, wait 5 seconds and plug it back in.</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/pluggingInPlugRetry.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.lineDistance} />
          <View style={setupStyle.buttonContainer}>
            <CancelButton onPress={() => {
              Alert.alert(
                "Are you sure?",
                "You can always add Crownstones later through the settings menu.",
                [{text:'No'},{text:'Yes, I\'m sure', onPress: Actions.tabBar}]
              )
              }} />
            <View style={{flex:1}} />
            <NextButton onPress={() => {Actions.setupAddPluginStep2({sphereId: this.props.sphereId, fromMainMenu: this.props.fromMainMenu})}} />
          </View>
        </View>
      </Background>
    )
  }
}

