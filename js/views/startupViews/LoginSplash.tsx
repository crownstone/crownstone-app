
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LoginSplash", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Linking,
  Image,
  TouchableOpacity,
  Text,
  View, TextStyle, SafeAreaView
} from "react-native";

import { Background } from './../components/Background'
import { colors, screenWidth, tabBarMargin } from "./../styles";
import loginStyles from './LoginStyles'

import DeviceInfo from 'react-native-device-info';
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

let versionStyle : TextStyle = {
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
      <Background fullScreen={true} image={core.background.mainDark} dimStatusBar={true}  hideOrangeLine={true} hideNotifications={true}>
        <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', flex: 1, marginBottom: tabBarMargin}}>
          <View style={{flex:0.5}} />
          <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
          <View style={{flex:2}} />
          <View style={loginStyles.loginButtonContainer}>
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => { NavigationUtil.navigate( 'Register'); }} >
                <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ lang("Register") }</Text></View>
              </TouchableOpacity>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => { NavigationUtil.navigate( 'Login'); }} >
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