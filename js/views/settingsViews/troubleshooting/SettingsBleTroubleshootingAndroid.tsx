
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleTroubleshootingAndroid", key)(a,b,c,d,e);
}
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
            <Text style={titleStyle}>{ lang("Troubleshooting") }</Text>
            <View style={{height:20}} />
            <IconButton name="ios-bluetooth" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />
            <View style={{height:20}} />
            <Text style={headerStyle}>{ lang("Sometimes__the_Bluetooth_o") }</Text>
            <Text style={explanationStyle}>{ lang("Unfortunately__sometimes_t") }</Text>
            <Text style={explanationStyle}>{ lang("To_reset_Bluetooth__simply") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/android/dragDown.png')} sourceWidth={500} sourceHeight={179} targetWidth={imageWidth} style={imageStyle} />
            <Text style={explanationStyle}>{ lang("Turn_off_Bluetooth_by_clic") }</Text>
            <ScaledImage source={require('../../../images/bleTroubleshooter/android/toggleBLE.png')} sourceWidth={500} sourceHeight={292} targetWidth={imageWidth} style={imageStyle} />
            <Text style={explanationStyle}>{ lang("Then_turn_Bluetooth_on_aga") }</Text>
            <View style={{height:50}} />
            <Text style={headerStyle}>{ lang("Enjoy_using_your_Crownston") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}