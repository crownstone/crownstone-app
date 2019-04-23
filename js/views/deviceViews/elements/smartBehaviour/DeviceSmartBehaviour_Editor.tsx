import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  availableScreenHeight,
  deviceStyles,
  OrangeLine,
  screenWidth,
} from "../../../styles";
import { Background } from "../../../components/Background";
import { core } from "../../../../core";
import { RuleEditor } from "./supportComponents/RuleEditor";


export class DeviceSmartBehaviour_Editor extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "A Crownstone",
    }
  };

  constructor(props) {
    super(props)
  }


  render() {
    let iconHeight = 0.10*availableScreenHeight;
    return (
      <Background image={core.background.detailsDark}>
        <OrangeLine/>
        <View style={{height:availableScreenHeight,width:screenWidth}}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableScreenHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ "Smart Behaviour" }</Text>
            <View style={{height: 0.2*iconHeight}} />
            <Text style={deviceStyles.specification}>{"Tap the underlined parts to customize them!"}</Text>
            <RuleEditor data={{
              action:   { type: "BE_ON", data: 1, },
              presence: { type: "SOMEBODY", data: { type: "SPHERE" }, delay: 5},
              time: {
                type: "RANGE",
                from: { type: "SUNSET",  offsetMinutes:0},
                to:   { type: "SUNRISE", offsetMinutes:0}
              },
              options: {
                type:"LOCATION_PRESENCE_AFTER"
              }
            }} />
          </View>
        </ScrollView>
        </View>
      </Background>
    )
  }
}
