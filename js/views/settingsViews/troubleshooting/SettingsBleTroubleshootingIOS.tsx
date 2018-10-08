import { Languages } from "../../../Languages"
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




export class SettingsBleTroubleshootingIOS extends Component<any, any> {

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
            <Text style={titleStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Troubleshooting")() }</Text>
            <View style={{height:20}} />
            <IconButton name="ios-bluetooth" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />
            <View style={{height:20}} />
            <Text style={headerStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Sometimes__the_Bluetooth_")() }</Text>
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Unfortunately__sometimes_")() }</Text>
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Im_sure_youre_all_familia")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenter.png')} sourceWidth={500} sourceHeight={588} targetWidth={imageWidth} style={imageStyle} />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "There_is_a_Bluetooth_icon")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenterBleOff.png')} sourceWidth={500} sourceHeight={243} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "To_reset_Bluetooth_the_ri")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsButton.png')} sourceWidth={500} sourceHeight={139} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "In_the_settings_overview_")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsOverview.png')} sourceWidth={500} sourceHeight={677} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Finally__in_the_Bluetooth")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetooth.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "The_result_should_be_")() }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetoothOff.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={explanationStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "You_wait_for_a_few_second")() }</Text>
            <View style={{height:50}} />
            <Text style={headerStyle}>{ Languages.text("SettingsBleTroubleshootingIOS", "Enjoy_using_your_Crownsto")() }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}