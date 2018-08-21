import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {IconButton} from "../../components/IconButton";
import {Background} from "../../components/Background";
import {colors, OrangeLine, screenWidth} from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";




export class SettingsBleTroubleshootingAndroid extends Component<any, any> {

  render() {
    let explanationStyle = {fontSize:15, padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center'};
    let headerStyle = {...explanationStyle, fontSize:18, fontWeight:'bold'};
    let titleStyle = {...explanationStyle, fontSize:30, fontWeight:'bold'};
    let imageStyle = {marginTop:10, marginBottom:10, borderRadius:10, borderColor: colors.black.rgba(0.5), borderWidth: 1}

    let imageWidth = 0.7*screenWidth;
    return (
      <Background image={this.props.backgrounds.menu}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={titleStyle}>{"Troubleshooting"}</Text>
            <View style={{height:20}} />
            <IconButton name="ios-bluetooth" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />
            <View style={{height:20}} />
            <Text style={headerStyle}>{
              "Sometimes, the Bluetooth on your iPhone can act up, refuse to work or be stuck on a connection."
            }</Text>
            <Text style={explanationStyle}>{
              "Unfortunately, sometimes things go wrong, and we're not allowed by the phone manufacturers reset the Bluetooth chip (and rightfully so!).\n\n" +
              "There are a few things you can do however, to fix most of these issues. This guide will walk you through the steps to reset your Bluetooth on iOS."
            }</Text>
            <Text style={explanationStyle}>{
              "I'm sure you're all familiar with the Apple Control Center. If you're not, it's this one:"
            }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenter.png')} sourceWidth={500} sourceHeight={588} targetWidth={imageWidth} style={imageStyle} />
            <Text style={explanationStyle}>{"There is a Bluetooth icon on there, but if you press it, you do NOT disable Bluetooth. You only tell it to stop connecting:"}</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenterBleOff.png')} sourceWidth={500} sourceHeight={243} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{"To reset Bluetooth the right way, we have to go into the settings of your iPhone by pressing on the cogwheel icon:"}</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsButton.png')} sourceWidth={500} sourceHeight={139} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{"In the settings overview, we select the Bluetooth bar:"}</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsOverview.png')} sourceWidth={500} sourceHeight={677} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{"Finally, in the Bluetooth menu, we disable Bluetooth by tapping on the switch:"}</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetooth.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{"The result should be:"}</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetoothOff.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{"You wait for a few seconds and then turn Bluetooth back on. Your Bluetooth has now been restarted, which will solve most related problems.\n\n" +
            "If any issues persist, you can try restarting your iPhone or run the Diagnostics in the Crownstone app.\n\n" +
            "If none of this works for you, contact us at team@crownstone.rocks and we'd be happy to help you solve the issue!"}</Text>
            <View style={{height:50}} />
            <Text style={headerStyle}>{
              "Enjoy using your Crownstones!"
            }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}