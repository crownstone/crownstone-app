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
  OrangeLine,
  screenWidth
} from "../../../styles";
import { Background } from "../../../components/Background";
import { core } from "../../../../core";
import { BehaviourRuleEditor } from "./supportComponents/BehaviourRuleEditor";
import { TwilightRuleEditor } from "./supportComponents/TwilightRuleEditor";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";


export class DeviceSmartBehaviour_Editor extends Component<{twilightRule: boolean, data: any}, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "A Crownstone",
    }
  };


  render() {
    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <OrangeLine/>
        <View style={{height:availableModalHeight,width:screenWidth}}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableScreenHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ "Create my Behaviour" }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{"Tap the underlined parts to customize them!"}</Text>
            { this.props.twilightRule ? <TwilightRuleEditor data={this.props.data} /> : <BehaviourRuleEditor data={this.props.data} /> }
          </View>
        </ScrollView>
        </View>
      </Background>
    )
  }
}
