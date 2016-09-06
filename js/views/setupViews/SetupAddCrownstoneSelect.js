import React, { Component } from 'react'
import {
  Alert,
  
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { setupStyle, SkipButton } from './SetupShared'
import { styles, colors, width, height } from './../styles'

export class SetupAddCrownstoneSelect extends Component {

  render() {
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        <View style={styles.shadedStatusBar} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={setupStyle.h0}>Add your Crownstone</Text>
          <Text style={setupStyle.text}>What sort of Crownstone would you like to add to the group?</Text>
          <View style={{flex:1}} />
          <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={subStyles.container}>
              <TouchableOpacity style={subStyles.button} onPress={() => {Actions.setupAddBuiltinStep1()}}>
                <Text>TODO: BUILT IN IMAGE</Text>
              </TouchableOpacity>
              <Text style={subStyles.text}>Built-in Version</Text>
            </View>
            <View style={subStyles.container}>
              <TouchableOpacity style={subStyles.button} onPress={() => {Actions.setupAddPluginStep1()}}>
                <Text>TODO: PLUG IN IMAGE</Text>
              </TouchableOpacity>
              <Text style={subStyles.text}>Plug-in Version</Text>
            </View>
          </View>
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <SkipButton onPress={() => {
              Alert.alert(
              "Are you sure?",
              "You can always add Crownstones later through the settings menu.",
              [{text:'No'},{text:'Yes, I\'m sure', onPress:Actions.tabBar}])}}
            />
            <View style={{flex:1}} />
          </View>
        </View>
      </Background>
    )
  }
}

let subStyles = StyleSheet.create({
  button:{
    width:width*0.4,
    height:width*0.4,
    borderRadius: width*0.2,
    backgroundColor:'rgba(255,255,255,0.2)',
    borderColor:'white',
    borderWidth:2,
    margin: width*0.05,
    marginBottom: 10,
    justifyContent:'center',
    alignItems:'center',
  },
  container: {
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'center',
  },
  text: {
    backgroundColor:'transparent',
    color:'white',
    fontSize:16,
    fontWeight:'500',

  }
  });

