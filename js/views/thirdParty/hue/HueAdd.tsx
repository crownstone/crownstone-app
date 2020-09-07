
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HueOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import {Background} from "../../components/Background";
import { colors, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { core } from "../../../core";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { StoneUtil } from "../../../util/StoneUtil";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Button } from "../../components/Button";
import { BehaviourCopySuccessPopup } from "../../deviceViews/smartBehaviour/DeviceSmartBehaviour";


export class HueAdd extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Philips Hue"});
  }


  render() {
    return (
      <Background image={core.background.menu} hasNavBar={false}>
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:20, paddingBottom:20}}>
            <Text style={styles.title}>{ "Pairing with Hue" }</Text>
            <View style={{height:10}} />
            <View style={{borderRadius:30, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
              <ScaledImage source={require('../../../images/thirdParty/hue/hue_bridge.png')} sourceWidth={2000} sourceHeight={2000} targetWidth={0.7*screenWidth} />
            </View>
            <View style={{height:10}} />
            <Text style={styles.header}>{ "In order to be able to communicate with your Hue lights, you'll need a Philips Hue Bridge." }</Text>
            <Text style={styles.explanation}>{ "Adding new Hue lights to your bridge should be done using the official Hue app." }</Text>
            <Text style={styles.explanation}>{ "Please go find your Bridge, ensure it's on and press the next button below!" }</Text>
            <View style={{flex:1}} />
            <Button
              backgroundColor={ colors.blue.rgba(0.5) }
              label={ "Next" }
              callback={() => {

              }}
              icon={'md-log-out'}
              iconSize={14}
              iconColor={colors.green.rgba(0.5)}
            />
          </View>
        </ScrollView>
      </Background>
    );
  }
}