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
import { styles, colors, screenWidth, screenHeight } from './../styles'
import { LOG } from '../../logging/Log'

export class SetupAddPlugInStep1 extends Component {
  render() {
    LOG("ENTERING ADDING CROWNSTONE INTERFACE WITH SPHERE : ", this.props.sphereId);
    let imageSize = 0.35;
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        {
          this.props.hideBack !== true ?
          <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true}/>
          :
          <View style={styles.shadedStatusBar}/>
        }
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={this.props.hideBack !== true ? [setupStyle.h1, {paddingTop:0}] : setupStyle.h1}>Adding a Plug-in Crownstone</Text>
          <Text style={setupStyle.text}>Step 1: Put the Crownstone in the power outlet.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Make sure there is nothing is plugged into the Crownstone.</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/pluggingInPlug.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.lineDistance} />
          <View style={setupStyle.buttonContainer}>
            <CancelButton onPress={() => {
              Alert.alert(
                "Are you sure?",
                "You can always add Crownstones later through the settings menu.",
                [{text:'No'},{text:'Yes, I\'m sure', onPress: () => {
                  if (this.props.fromMainMenu === true) {
                    Actions.tabBar();
                  }
                  else {
                    Actions.setupAddPluginStep4({sphereId: this.props.sphereId})
                  }
                }}]
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

