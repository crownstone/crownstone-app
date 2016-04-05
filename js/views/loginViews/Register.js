import React, {
  Component,
  Dimensions,
  Image,
  NativeModules,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './../components/Background'

import {stylesIOS, colors} from './../styles'
let styles = stylesIOS;

export class Register extends Component {
  render() {
    let width = Dimensions.get('window').width;
    let buttonWidth = 0.4 * width;
    let spacerWidth = 0.07 * width;

    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <View style={{flexDirection:'row', flex:1, alignItems:'flex-end', justifyContent:'center', paddingBottom:30}}>
          <View style={{width:spacerWidth}} />
          <TouchableOpacity onPress={() => {Actions.register()}} >
            <View style={[styles.loginButton, {width:buttonWidth}]}><Text style={styles.loginText}>Register</Text></View>
          </TouchableOpacity>
          <View style={{flex:1}} />
          <TouchableOpacity onPress={() => {Actions.login()}} >
            <View style={[styles.loginButton, {width:buttonWidth}]}><Text style={styles.loginText}>Log In</Text></View>
          </TouchableOpacity>
          <View style={{width:spacerWidth}} />
        </View>
      </Background>
    )
  }
}
