
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsFactoryResetStep1", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Image,
  Text,
  View
} from 'react-native';


import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { setupStyle, NextButton } from './SetupShared'
import {background, screenHeight, topBarHeight} from "./../styles";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { core } from "../../Core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import {SettingsBackground} from "../components/SettingsBackground";
import {SafeAreaView} from "react-native-safe-area-context";

export class SettingsFactoryResetStep1 extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Factory_Reset"), closeModal: true});
  }

  render() {
    let imageSize = 0.40;
    return (
      <SettingsBackground>
        <SafeAreaView style={{flex:1}}>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.text]}>{ lang("If_youre_physically_next_") }</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information]}>{ lang("Please_take_the_Crownston") }</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../../assets/images/lineDrawings/pluggingInPlugRetry.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
          </View>
          <View style={{flex:1}} />

          <View style={setupStyle.buttonContainer}>
            <View style={{flex:1}} />
            <NextButton onPress={ () => {
              NavigationUtil.navigate( "SettingsFactoryResetStep2");
              // trigger to start the process
              setTimeout(() => { core.eventBus.emit("StartFactoryResetProcess"); }, 1000)
            }} />
          </View>
        </SafeAreaView>
      </SettingsBackground>
    )
  }
}

