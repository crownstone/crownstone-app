
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Editor", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  availableModalHeight,
  deviceStyles,
  screenWidth
} from "../../../styles";
import { Background } from "../../../components/Background";
import { core } from "../../../../core";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { RuleEditor } from "./supportComponents/RuleEditor";


export class DeviceSmartBehaviour_Editor extends Component<{twilightRule: boolean, data: any, sphereId: string, stoneId: string, ruleId: any, label:string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Rule Editor" });
  }

  render() {
    let header = lang("Create_my_Behaviour")
    if (this.props.ruleId) {
      header = "Customize my Behaviour!";
    }

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
      <View style={{height:availableModalHeight,width:screenWidth}}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_underlined_parts_t") }</Text>
            <RuleEditor sphereId={this.props.sphereId} stoneId={this.props.stoneId} data={this.props.data} twilightRule={this.props.twilightRule}/>
          </View>
        </ScrollView>
        </View>
      </Background>
    )
  }
}
