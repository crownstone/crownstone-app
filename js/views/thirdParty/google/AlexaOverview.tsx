
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("GoogleAssistantOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import {Background} from "../../components/Background";
import { screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class GoogleAssistantOverview extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: 'Google Assistant'});
  }


  render() {
    return (
      <Background image={core.background.menu} hasNavBar={false}>
                <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={styles.title}>{ "Ok Google, turn me on!" }</Text>
            <View style={{height:20}} />
            <ScaledImage source={require('../../../images/thirdParty/logo/googleAssistant_horizontal.png')} sourceWidth={1695} sourceHeight={695} targetWidth={0.8*screenWidth} style={695} />
            <View style={{height:20}} />
            <Text style={styles.header}>{ "Crownstone is now available as a Google Assistant Action!" }</Text>
            <Text style={styles.explanation}>{ "You can now go to your Google Assistant App, navigate to Devices, Add... and link a smart home device!" }</Text>
            <Text style={styles.explanation}>{ "After linking you can control all your Crownstons via Google Home and Google Assistant!" }</Text>
            <Text style={styles.explanation}>{ "When you tell Google to switch on a Crownstone, Google will push a command to your phone, and have that switch the Crownstone." }</Text>
            <Text style={styles.explanation}>{ "Enjoy using your Google Assistant!" }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}