
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("Ability_TapToToggleInformation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';


import { background, screenHeight, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {ScaledImage} from "../../../components/ScaledImage";
import { TopBarUtil } from "../../../../util/TopBarUtil";


export class Ability_TapToToggleInformation extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Tap_to_Toggle")});
  }

  render() {
    return (
      <Background hasNavBar={false} image={background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../../assets/images/overlayCircles/tapToToggle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ lang("If_you_dont_want_to_open_") }</Text>
            <Text style={styles.explanation}>{ lang("Your_phone_broadcasts_a_s") }</Text>
            <Text style={styles.explanation}>{ lang("Once_your_phone_is_close_") }</Text>
            <Text style={styles.explanation}>{ lang("You_can_choose_how_close_") }</Text>
            <Text style={styles.explanation}>{ lang("If_youd_prefer_to_enable_") }</Text>
            <Text style={styles.explanation}>{ lang("Tap_to_toggle_is_not_mean") }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}