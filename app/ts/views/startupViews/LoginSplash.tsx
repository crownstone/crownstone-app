
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
  View, TextStyle, Pressable
} from "react-native";

import { Background } from './../components/Background'
import {background, colors, deviceModel, screenWidth, tabBarMargin} from "./../styles";
import loginStyles from './LoginStyles'

import DeviceInfo from 'react-native-device-info';
import { NavigationUtil } from "../../util/NavigationUtil";
import {TestingFramework} from "../../backgroundProcesses/testing/TestingFramework";

let versionStyle : TextStyle = {
  backgroundColor:"transparent",
  color: colors.csBlueDarker.rgba(0.4),
  fontSize: 10,
};

export class LoginSplash extends Component<any, any> {

  clicks = 0;
  timeout;

  componentWillUnmount() {
    clearTimeout(this.timeout);
  }

  render() {
    console.log("LoginSplash render", deviceModel)
    let factor = 0.25;

    return (
      <Background fullScreen={true} image={background.main} dimStatusBar={true}  hideNotifications={true} testID={"LoginSplash"}>
        <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', flex: 1, marginBottom: tabBarMargin}}>
          <View style={{flex:0.5}} />
          <Image source={require('../../../assets/images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606, tintColor: colors.black.hex}}/>
          <View style={{flex:2}} />
          <View style={loginStyles.loginButtonContainer}>
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => { NavigationUtil.navigate( 'Register'); }} testID={"registerButton"}>
                <View style={loginStyles.loginButton}><Text style={loginStyles.loginText}>{ lang("Register") }</Text></View>
              </TouchableOpacity>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => { NavigationUtil.navigate( 'Login'); }} testID={"loginButton"}>
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
            onPress={() => { Linking.openURL(Languages.activeLocale === 'nl_nl' ? 'https://shop.crownstone.rocks/?launch=nl&ref=app/addCrownstone' : 'https://shop.crownstone.rocks/?launch=en&ref=app/addCrownstone').catch(err => {}) }}>
            <Text style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: colors.csOrange.hex,
              fontStyle:'italic',
              textDecorationLine: 'underline',
              backgroundColor:'transparent'
            }}>{ lang("Buy_Crownstones_") }</Text>
          </TouchableOpacity>
          <Pressable
            onPress={() => { this._pressedVersion() }}
            style={{position:'absolute', bottom:3, right:3}} testID={"VersionHiddenButton"}>
            <Text style={versionStyle}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
          </Pressable>
        </View>
      </Background>
    )
  }

  async _pressedVersion() {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => { this.clicks = 0; }, 200);
    this.clicks++;
    if (this.clicks >= 5) {
      await TestingFramework.clear();
      NavigationUtil.launchModal("TestConfiguration");
      this.clicks = 0;
      clearTimeout(this.timeout);
    }
  }
}
