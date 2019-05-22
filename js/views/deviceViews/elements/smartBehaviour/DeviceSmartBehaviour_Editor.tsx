
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
  availableScreenHeight,
  deviceStyles,
  screenWidth
} from "../../../styles";
import { Background } from "../../../components/Background";
import { core } from "../../../../core";
import { BehaviourRuleEditor } from "./supportComponents/BehaviourRuleEditor";
import { TwilightRuleEditor } from "./supportComponents/TwilightRuleEditor";


export class DeviceSmartBehaviour_Editor extends Component<{twilightRule: boolean, data: any, sphereId: string, stoneId: string}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("A_Crownstone"),
    }
  };


  render() {
    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
                <View style={{height:availableModalHeight,width:screenWidth}}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableScreenHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ lang("Create_my_Behaviour") }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_underlined_parts_t") }</Text>
            { this.props.twilightRule ?
              <TwilightRuleEditor  sphereId={this.props.sphereId} stoneId={this.props.stoneId} data={this.props.data} /> :
              <BehaviourRuleEditor sphereId={this.props.sphereId} stoneId={this.props.stoneId} data={this.props.data} /> }
          </View>
        </ScrollView>
        </View>
      </Background>
    )
  }
}
