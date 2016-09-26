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

import { Icon } from '../components/Icon'
import { Background } from '../components/Background'
import { setupStyle, CancelButton, NextButton } from './SetupShared'
import { styles, colors, screenWidth, screenHeight } from './../styles'

export class SetupAddPlugInStep4 extends Component {
  render() {
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1]}>Ready to get started?</Text>
          <Text style={setupStyle.text}>Would you like to add another Crownstone to your Sphere?</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>You can always add more Crownstones later through the settings menu.</Text>
          <View style={{flex:1}} />
          <TouchableOpacity style={{paddingLeft:20, paddingRight:30,flexDirection:'row',
            alignItems: 'center',
            justifyContent:'flex-start'}} onPress={() => {Actions.setupAddPluginStep1({hideBack:true, sphereId: this.props.sphereId});}}>
            <Icon name="c2-plugin" size={100} color="#fff" style={{backgroundColor:'transparent', width:105, position:'relative', top:3}} />
            <Text style={[setupStyle.information, {width: screenWidth - 140, paddingLeft:5, paddingRight:0}]}>Add more Crownstones</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity style={{paddingLeft:30, paddingRight:30, flexDirection:'row',
            alignItems: 'center',
            justifyContent:'flex-start'}} onPress={
            () => {
              this.props.store.dispatch({type:'UPDATE_APP_STATE', data: {doFirstTimeSetup: false}});
              Actions.tabBar();
            }}>
            <Icon name="md-log-in" size={100} color="#fff" style={{backgroundColor:'transparent', width:95, position:'relative', top:5}} />
            <Text style={[setupStyle.information, {width: screenWidth - 140, paddingLeft:5, paddingRight:0}]}>Let's get started!</Text>
          </TouchableOpacity>
          <View style={{flex:1}} />
        </View>
      </Background>
    )
  }
}