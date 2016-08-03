import React, { Component } from 'react'
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './../components/Background'
import { styles, colors} from './../styles'
import loginStyles from './LoginStyles'


export class LoginSplash extends Component {
  render() {
    return (
      <Background hideInterface={true} background={require('../../images/loginBackground.png')}>
        <View style={styles.shadedStatusBar} />
        <View style={loginStyles.loginButtonContainer}>
          <TouchableOpacity onPress={() => {Actions.register()}} >
            <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Register</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {Actions.login()}} >
            <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>Log In</Text></View>
          </TouchableOpacity>

        </View>
      </Background>
    )
  }
}