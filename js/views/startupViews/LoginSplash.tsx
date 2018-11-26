
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LoginSplash", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Linking,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { Background } from './../components/Background'
import { colors, screenWidth} from './../styles'
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
    let factor = 0.25;

    return (
      <Background fullScreen={true} image={this.props.backgrounds.mainDark} shadedStatusBar={true} safeView={true}>
        <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', flex: 1}}>
          <View style={{flex:0.5}} />
          <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
          <View style={{flex:2}} />
          <View style={loginStyles.loginButtonContainer}>
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => {Actions.register()}} >
                <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ lang("Register") }</Text></View>
              </TouchableOpacity>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => {Actions.login()}} >
                <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ lang("Log_In") }</Text></View>
              </TouchableOpacity>
              <View style={{flex:1}} />
            </View>
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
            }}>{ lang("Buy_Crownstones_") }</Text>
          </TouchableOpacity>
          <Text style={versionStyle}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
        </View>
      </Background>
    )
  }
}