
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("HueAdd", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View
} from 'react-native';
import {Background} from "../../components/Background";
import { background, colors, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { Button } from "../../components/Button";


export class HueAdd extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Philips_Hue")});
  }


  render() {
    return (
      <Background image={background.menu} hasNavBar={false}>
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:20, paddingBottom:20}}>
            <Text style={styles.title}>{ lang("Pairing_with_Hue") }</Text>
            <View style={{height:10}} />
            <View style={{borderRadius:30, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
              <ScaledImage source={require('../../../../assets/images/thirdParty/hue/hue_bridge.png')} sourceWidth={2000} sourceHeight={2000} targetWidth={0.7*screenWidth} />
            </View>
            <View style={{height:10}} />
            <Text style={styles.header}>{ lang("In_order_to_be_able_to_co") }</Text>
            <Text style={styles.explanation}>{ lang("Adding_new_Hue_lights_to_") }</Text>
            <Text style={styles.explanation}>{ lang("Please_go_find_your_Bridg") }</Text>
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