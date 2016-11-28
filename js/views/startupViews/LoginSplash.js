import React, { Component } from 'react'
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;


import { Background } from './../components/Background'
import { styles, colors, screenWidth, screenHeight } from './../styles'
import loginStyles from './LoginStyles'


export class LoginSplash extends Component {
  render() {
    return (
      <Background hideInterface={true} image={this.props.backgrounds.mainDarkLogo}>
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