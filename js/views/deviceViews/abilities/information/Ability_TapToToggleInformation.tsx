import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';


import { colors, screenHeight, screenWidth, styles } from "../../../styles";
import {Background} from "../../../components/Background";
import {IconButton} from "../../../components/IconButton";
import {ScaledImage} from "../../../components/ScaledImage";
import { core } from "../../../../core";
import { TopBarUtil } from "../../../../util/TopBarUtil";


export class Ability_TapToToggleInformation extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Tap to Toggle"});
  }

  render() {
    return (
      <Background hasNavBar={false} image={core.background.lightBlurLighter}>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../../images/overlayCircles/tapToToggle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.2*screenHeight} />
            <View style={{height:40}} />
            <Text style={styles.boldExplanation}>{ "If you don't want to open the app to toggle a specific Crownstone, just hold your phone against it!" }</Text>
            <Text style={styles.explanation}>{ "Your phone broadcasts a signal that the Crownstones can pick up! The minimum distance your phone will toggle any of your Crownstones is configured in the app settings." }</Text>
            <Text style={styles.explanation}>{ "Once your phone is close enough to the Crownstone to activate tap to toggle, the Crownstone will toggle on and off as long as the phone is near. " }</Text>
            <Text style={styles.explanation}>{ "You can choose how close you have to hold your phone before it starts to toggle. Additionally, you can globally enable or disable tap to toggle in the app settings." }</Text>
            <Text style={styles.explanation}>{ "If you'd prefer to enable or disable tap to toggle for individual Crownstones, you can do that in the abilities!" }</Text>
            <Text style={styles.explanation}>{ "Tap to toggle is not meant to replace presence based behaviour." }</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}