
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleTroubleshootingIOS", key)(a,b,c,d,e);
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
import {Background} from "../../components/Background";
import {colors, OrangeLine, screenWidth} from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";




export class AlexaOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Amazon Alexa",
    }
  };

  render() {
    let explanationStyle = {fontSize:15, padding: 20, paddingTop:10, paddingBottom:10, textAlign:'center'};
    let headerStyle = {...explanationStyle, fontSize:18, fontWeight:'bold'};
    let titleStyle = {...explanationStyle, fontSize:30, fontWeight:'bold'};
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false} safeView={true}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={titleStyle}>{ "Working with Alexa" }</Text>
            <View style={{height:20}} />
            <ScaledImage source={require('../../../images/thirdParty/logo/amazonAlexa.png')} sourceWidth={264} sourceHeight={265} targetWidth={128} style={128} />
            <View style={{height:20}} />
            <Text style={headerStyle}>{ "Crownstone is now available as an Amazon Alexa skill!" }</Text>
            <Text style={explanationStyle}>{ "You can now go to your Alexa App, navigate to the smart home are and install the Crownstone skill!" }</Text>
            <Text style={explanationStyle}>{ "You will receive a list of all your Crownstones, which you can turn on and off via voice commands!" }</Text>
            <Text style={explanationStyle}>{ "When you tell Alexa to switch on a Crownstone, Alexa will push a command to your phone, and have that switch the Crownstone." }</Text>
            <Text style={explanationStyle}>{ "We're hard at work adding more features, like dimming and location based utterances." }</Text>
            <Text style={explanationStyle}>{ "Expect more to come and enjoy using Alexa!" }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}