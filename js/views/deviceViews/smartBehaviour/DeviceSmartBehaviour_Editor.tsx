
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Editor", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text, TouchableOpacity,
  View
} from "react-native";

import {
  availableModalHeight, availableScreenHeight, colors,
  deviceStyles, screenHeight,
  screenWidth, statusBarHeight
} from "../../styles";
import { Background } from "../../components/Background";
import { core } from "../../../core";
import { RuleEditor } from "./supportComponents/RuleEditor";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { Icon } from "../../components/Icon";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class DeviceSmartBehaviour_Editor extends Component<{twilightRule: boolean, data: any, sphereId: string, stoneId: string, ruleId: any, label:string, onlyForDay?: string, isModal?:boolean}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: props.typeLabel || "Edit Behaviour", closeModal: props.isModal});
  }

  render() {
    let header = lang("Create_my_Behaviour")
    if (this.props.ruleId || this.props.onlyForDay !== undefined) {
      header = "Customize my Behaviour!";
    }

    let height = availableModalHeight;
    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <View style={{height:height,width:screenWidth}}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:height, alignItems:'center', paddingTop:30}}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height: 0.02*height}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_underlined_parts_t") }</Text>
            <RuleEditor {...this.props} />
          </View>
        </ScrollView>
        </View>
      </Background>
    )
  }
}
