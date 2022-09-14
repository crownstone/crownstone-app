
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

import {Background, BackgroundCustomTopBar} from './../components/Background'
import {background, colors, deviceModel, screenWidth, tabBarMargin} from "./../styles";
import loginStyles from './LoginStyles'

import DeviceInfo from 'react-native-device-info';
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context";

let versionStyle : TextStyle = {
  backgroundColor:"transparent",
  color: colors.csBlueDarker.rgba(0.4),
  fontSize: 10,
};

export function LoginSplash(props) {

  console.log("LoginSplash render", deviceModel)

  console.log("Device Manufacturer",    DeviceInfo.getManufacturer());     // e.g. Apple
  console.log("Device Brand",           DeviceInfo.getBrand());            // e.g. Apple / htc / Xiaomi
  console.log("Device Model",           DeviceInfo.getModel());            // e.g. iPhone 6
  console.log("Device ID",              DeviceInfo.getDeviceId());         // e.g. iPhone7,2 / or the board on Android e.g. goldfish
  console.log("System Name",            DeviceInfo.getSystemName());       // e.g. iPhone OS
  console.log("System Version",         DeviceInfo.getSystemVersion());    // e.g. 9.0
  console.log("Bundle ID",              DeviceInfo.getBundleId());         // e.g. com.learnium.mobile
  console.log("Build Number",           DeviceInfo.getBuildNumber());      // e.g. 89
  console.log("App Version",            DeviceInfo.getVersion());          // e.g. 1.1.0
  console.log("App Version (Readable)", DeviceInfo.getReadableVersion());  // e.g. 1.1.0.89
  console.log("Device Name",            DeviceInfo.getDeviceName());       // e.g. Becca's iPhone 6
  let factor = 0.2;

  return (
    <BackgroundCustomTopBar testID={"LoginSplash"}>
      <SafeAreaView style={{ flex: 1}}>
        <View style={{alignItems:'center', justifyContent: 'center', flex:1 }}>
          <View style={{flex:0.85}} />
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
            testID={"BuyButton"}
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
          <View
            style={{position:'absolute', bottom:3, right:3}} testID={"VersionHiddenButton"}>
            <Text style={versionStyle}>{ lang("version__",DeviceInfo.getReadableVersion()) }</Text>
          </View>
        </View>
      </SafeAreaView>
    </BackgroundCustomTopBar>
  );
}