
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
import { background, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class GoogleAssistantOverview extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Google_Assistant")});
  }


  render() {
    return (
      <Background image={background.menu} hasNavBar={false}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:20}} />
            <Text style={styles.title}>{ lang("Ok_Google__turn_me_on_") }</Text>
            <View style={{height:20}} />
            <ScaledImage source={require('../../../../assets/images/thirdParty/logo/googleAssistant_horizontal.png')} sourceWidth={1695} sourceHeight={695} targetWidth={0.8*screenWidth} />
            <View style={{height:20}} />
            <Text style={styles.header}>{ lang("Crownstone_is_now_availab") }</Text>
            <Text style={styles.explanation}>{ lang("You_can_now_go_to_your_Go") }</Text>
            <Text style={styles.explanation}>{ lang("After_linking_you_can_con") }</Text>
            <Text style={styles.explanation}>{ lang("When_you_tell_Google_to_s") }</Text>
            <Text style={styles.explanation}>{ lang("Enjoy_using_your_Google_A") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}