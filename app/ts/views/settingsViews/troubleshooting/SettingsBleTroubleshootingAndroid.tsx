
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleTroubleshootingAndroid", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import {IconButton} from "../../components/IconButton";
import {Background} from "../../components/Background";
import { background, colors, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../Core";
import { BackgroundNoNotification } from "../../components/BackgroundNoNotification";




export class SettingsBleTroubleshootingAndroid extends Component<any, any> {

  render() {
    let imageStyle = {marginTop:10, marginBottom:10, borderRadius:10, borderColor: colors.black.rgba(0.5), borderWidth: 1};

    let imageWidth = 0.7*screenWidth;
    return (
      <BackgroundNoNotification image={background.menu} hasNavBar={false}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={styles.title}>{ lang("Troubleshooting") }</Text>
            <View style={{height:20}} />
            <IconButton name="ios-bluetooth" buttonSize={80} size={60}  color="#fff" buttonStyle={{backgroundColor:colors.blue3.hex}} />
            <View style={{height:20}} />
            <Text style={styles.header}>{ lang("Sometimes__the_Bluetooth_o") }</Text>
            <Text style={styles.explanation}>{ lang("Unfortunately__sometimes_t") }</Text>
            <Text style={styles.explanation}>{ lang("To_reset_Bluetooth__simply") }</Text>
            <ScaledImage source={require('../../../../assets/images/bleTroubleshooter/android/dragDown.png')} sourceWidth={500} sourceHeight={179} targetWidth={imageWidth} style={imageStyle} />
            <Text style={styles.explanation}>{ lang("Turn_off_Bluetooth_by_clic") }</Text>
            <ScaledImage source={require('../../../../assets/images/bleTroubleshooter/android/toggleBLE.png')} sourceWidth={500} sourceHeight={292} targetWidth={imageWidth} style={imageStyle} />
            <Text style={styles.explanation}>{ lang("Then_turn_Bluetooth_on_aga") }</Text>
            <View style={{height:50}} />
            <Text style={styles.header}>{ lang("Enjoy_using_your_Crownston") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}