
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleTroubleshootingIOS", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import {IconButton} from "../../components/IconButton";
import {Background} from "../../components/Background";
import { colors, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../core";
import { BackgroundNoNotification } from "../../components/BackgroundNoNotification";




export class SettingsBleTroubleshootingIOS extends Component<any, any> {

  render() {
    let imageStyle = {marginTop:10, marginBottom:10, borderRadius:10, borderColor: colors.black.rgba(0.5), borderWidth: 1};

    let imageWidth = 0.7*screenWidth;
    return (
      <BackgroundNoNotification image={core.background.menu} hasNavBar={false}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={styles.title}>{ lang("Troubleshooting") }</Text>
            <View style={{height:20}} />
            <IconButton name="ios-bluetooth" buttonSize={80} size={60}  color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />
            <View style={{height:20}} />
            <Text style={styles.header}>{ lang("Sometimes__the_Bluetooth_") }</Text>
            <Text style={styles.explanation}>{ lang("Unfortunately__sometimes_") }</Text>
            <Text style={styles.explanation}>{ lang("Im_sure_youre_all_familia") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenter.png')} sourceWidth={500} sourceHeight={588} targetWidth={imageWidth} style={imageStyle} />
            <Text style={styles.explanation}>{ lang("There_is_a_Bluetooth_icon") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosControlCenterBleOff.png')} sourceWidth={500} sourceHeight={243} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={styles.explanation}>{ lang("To_reset_Bluetooth_the_ri") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsButton.png')} sourceWidth={500} sourceHeight={139} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={styles.explanation}>{ lang("In_the_settings_overview_") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsOverview.png')} sourceWidth={500} sourceHeight={677} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={styles.explanation}>{ lang("Finally__in_the_Bluetooth") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetooth.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={styles.explanation}>{ lang("The_result_should_be_") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/ios/iosSettingsBluetoothOff.png')} sourceWidth={500} sourceHeight={403} targetWidth={imageWidth} style={imageStyle}  />
            <Text style={styles.explanation}>{ lang("You_wait_for_a_few_second") }</Text>
            <View style={{height:50}} />
            <Text style={styles.header}>{ lang("Enjoy_using_your_Crownsto") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}