import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { Background } from './../components/Background'
import { styles, colors, screenWidth, screenHeight } from './../styles'
import loginStyles from './LoginStyles'

const DeviceInfo = require('react-native-device-info');

let versionStyle = {
  position:'absolute',
  bottom:3,
  right:3,
  backgroundColor:"transparent",
  color: colors.white.rgba(0.4),
  fontWeight:'300',
  fontSize: 10,
};

export class LoginSplash extends Component<any, any> {
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
        <TouchableOpacity
          style={{
            position:'absolute',
            bottom:5,
            left:5,
            width: 0.5*screenWidth,
            height:30,
            alignItems:'flex-start',
            justifyContent:'flex-end'
          }}
          onPress={() => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }}>
          <Text style={{
            fontSize: 14,
            fontWeight: 'bold',
            color: colors.white.hex,
            fontStyle:'italic',
            textDecorationLine: 'underline',
            backgroundColor:'transparent'
          }}>{'Buy Crownstones!'}</Text>
        </TouchableOpacity>
        <Text style={versionStyle}>{'version: ' + DeviceInfo.getReadableVersion()}</Text>
      </Background>
    )
  }
}