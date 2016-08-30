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
import { setupStyle, CancelButton, NextButton } from './SetupShared'
import { styles, colors, screenWidth, screenHeight } from './../styles'

export class SetupAddPlugInStep4 extends Component {
  render() {
    let imageSize = 0.35*screenWidth;
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1]}>Ready to get started?</Text>
          <Text style={setupStyle.text}>Would you like to add another Crownstone to your Group?</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can always add more Crownstones later through the settings menu.</Text>
          <View style={{flex:1}} />
          <TouchableOpacity style={{paddingLeft:30, paddingRight:30}} onPress={() => {Actions.setupAddPluginStep1({hideBack:true});}}>
            <View style={styles.rowCentered}>
              <Image source={require('../../images/lineDrawings/addCrownstone.png')} style={{width:imageSize, height:imageSize}} />
              <View style={{flexDirection:'column', flex:1}}>
                <Text style={setupStyle.information}>Add another Crownstone</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity style={{paddingLeft:30, paddingRight:30}} onPress={
            () => {
              this.props.store.dispatch({type:'UPDATE_APP_STATE', data: {doFirstTimeSetup: false}});
              Actions.tabBar();
            }}>
            <View style={styles.rowCentered}>
              <Image source={require('../../images/lineDrawings/getStarted.png')} style={{width:imageSize, height:imageSize}} />
              <View style={{flexDirection:'column', flex:1}}>
                <Text style={setupStyle.information}>Finish setting up Crownstones</Text>
              </View>
            </View>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </Background>
    )
  }
}