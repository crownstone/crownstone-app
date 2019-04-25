
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';


import { deviceStyles, OrangeLine, screenHeight, screenWidth } from "../../../styles";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";

export class DeviceSmartBehaviour_RuleOverview extends Component<any, any> {
  render() {
    let iconSize = 0.15*screenHeight;

    return (
      <View style={{ width: screenWidth, alignItems:'center' }}>
        <View style={{height: 30}} />
        <Text style={[deviceStyles.header]}>{ "My Behaviour" }</Text>
        <View style={{height: 0.2*iconSize}} />
        <WeekDayList
          data={{Mon: true, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false}}
          tight={true}
          darkTheme={true}
          onChange={() => {}}
        />
        <View style={{height: 0.1*iconSize}} />
        <SmartBehaviourSummaryGraph />
      </View>
    )
  }
}
