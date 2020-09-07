
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


export class HueOverview extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Philips Hue"});
  }


  render() {
    return (
      <Background image={core.background.menu} hasNavBar={false}>
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:20, paddingBottom:20}}>
            <Text style={styles.title}>{ "Lights everywhere!" }</Text>
            <View style={{height:20}} />
            <View style={{borderRadius:30, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
              <ScaledImage source={require('../../../images/thirdParty/logo/philipsHue.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.5*screenWidth} />
            </View>
            <View style={{height:20}} />
            <Text style={styles.header}>{ "You can now control your Hue lights through the Crownstone App!" }</Text>
            <Text style={styles.explanation}>{ "This means you can also use them with the Scenes! You can make your single tap set an even nicer mood!" }</Text>
            <View style={{flex:1}} />
            <Button
              backgroundColor={ colors.blue.rgba(0.5) }
              label={ "Let's set it up!" }
              callback={() => {
                NavigationUtil.navigate('HueAdd', {sphereId: this.props.sphereId})
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