import { Languages } from "../../Languages"
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
import { colors} from './../styles'

const DeviceInfo = require('react-native-device-info');

let versionStyle = {
  backgroundColor:"transparent",
  color: colors.white.rgba(0.4),
  fontWeight:'300',
  fontSize: 10,
};

export class Splash extends Component<any, any> {
  render() {
    let factor = 0.25;

    return (
      <Background fullScreen={true} image={this.props.backgrounds.mainDark} shadedStatusBar={true} safeView={true}>
        <View style={{flexDirection:'column', alignItems:'center', justifyContent: 'center', flex: 1}}>
          <View style={{flex:0.5}} />
          <Image source={require('../../images/crownstoneLogoWithText.png')} style={{width:factor * 998, height: factor*606}}/>
          <View style={{flex:2}} />
          <Text style={versionStyle}>{ Languages.text("Splash", "version__")(DeviceInfo.getReadableVersion()) }</Text>
          <View style={{flex:0.5}} />
        </View>
      </Background>
    )
  }
}