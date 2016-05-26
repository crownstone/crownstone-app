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
import { setupStyle } from './SetupStyles'
import { styles, colors, width, height } from './../styles'
var Icon = require('react-native-vector-icons/Ionicons');

export class SetupAddPlugInStep1 extends Component {
  render() {
    return (
      <Background hideInterface={true} background={require('../../images/setupBackground.png')}>
        <TopBar left='Back' leftAction={Actions.pop} style={{backgroundColor:'transparent'}} shadeStatus={true} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1, {paddingTop:0}]}>Adding a Plug-in Crownstone</Text>
          <Text style={setupStyle.text}>Step 1: Put the Crownstone in the power outlet.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Make sure there is nothing is plugged into the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>TODO: illustration of doing this.</Text>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <TouchableOpacity onPress={() => {
              Alert.alert(
                "Are you sure?",
                "You can always add Crownstones later through the settings menu.",
                [{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{Actions.tabBar()}}]
              )
              }} >
              <View style={{paddingLeft:20, flexDirection:'row', height:30}}>
                <Icon name="ios-remove-circle-outline" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingRight:8}} />
                <Text style={[setupStyle.buttonText,{fontWeight:'300'}]}>Cancel</Text>
              </View>
            </TouchableOpacity>
            <View style={{flex:1}} />
            <TouchableOpacity onPress={Actions.setupAddPluginStep2} >
              <View style={{paddingRight:20, flexDirection:'row', height:30}}>
                <Text style={[setupStyle.buttonText]}>Next</Text>
                <Icon name="ios-arrow-forward" size={30} color={'#fff'} style={{position:'relative', top:-2, paddingLeft:8}} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Background>
    )
  }
}

