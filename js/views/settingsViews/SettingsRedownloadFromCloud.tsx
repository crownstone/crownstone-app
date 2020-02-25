
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsRedownloadFromCloud", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity, ScrollView
} from "react-native";

import { Background } from '../components/Background'
import { availableModalHeight, colors, deviceStyles, screenHeight, screenWidth } from "../styles";
import {IconButton} from "../components/IconButton";
import {AppUtil} from "../../util/AppUtil";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";


export class SettingsRedownloadFromCloud extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Reset_from_Cloud"), closeModal: true});
  }


  render() {
    return (
      <Background image={core.background.menu} hasNavBar={false}>
        <ScrollView>
          <View style={{flex:1, alignItems:'center', padding: 20, minHeight: availableModalHeight}}>
            <Text style={[deviceStyles.header,{color:colors.menuBackground.hex}]}>{ lang("Replace_local_data_with_C") }</Text>
            <View style={{flex:1}} />
            <IconButton
              name="md-cloud-download"
              size={0.15*screenHeight}
              color="#fff"
              buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
              style={{position:'relative'}}
            />
            <View style={{flex:1}} />
            <Text style={[deviceStyles.errorText,{color:colors.menuBackground.hex}]}>{ lang("To_restore_your_local_dat") }</Text>
            <View style={{flex:1}} />
            <TouchableOpacity
              onPress={() => { AppUtil.resetDatabase() }}
              style={{ width:0.7*screenWidth, height:50, borderRadius: 25, borderWidth:2, borderColor: colors.menuBackground.hex, alignItems:'center', justifyContent:'center'}}
            >
              <Text style={{fontSize:18, color: colors.menuBackground.hex, fontWeight: 'bold'}}>{ lang("Im_sure__do_it_") }</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Background>
    );
  }
}
