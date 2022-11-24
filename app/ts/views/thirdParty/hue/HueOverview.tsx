
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
import { background, colors, screenWidth, styles } from "../../styles";
import {ScaledImage} from "../../components/ScaledImage";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { Button } from "../../components/Button";
import { SettingsScrollView } from "../../components/SettingsScrollView";
import { SettingsBackground } from "../../components/SettingsBackground";


export class HueOverview extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Philips_Hue")});
  }


  render() {
    return (
      <SettingsBackground>
        <SettingsScrollView>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:20, paddingBottom:20}}>
            <Text style={styles.title}>{ lang("Lights_everywhere_") }</Text>
            <View style={{height:20}} />
            <View style={{borderRadius:30, alignItems:"center", justifyContent:"center", overflow:'hidden'}}>
              <ScaledImage source={require('../../../../assets/images/thirdParty/logo/philipsHue.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.5*screenWidth} />
            </View>
            <View style={{height:20}} />
            <Text style={styles.header}>{ lang("You_can_now_control_your_") }</Text>
            <Text style={styles.explanation}>{ lang("This_means_you_can_also_u") }</Text>
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
        </SettingsScrollView>
      </SettingsBackground>
    );
  }
}
