
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';


import { deviceStyles, screenHeight, screenWidth } from "../../../styles";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { core } from "../../../../core";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu","Fri","Sat"];

export class DeviceSmartBehaviour_RuleOverview extends Component<any, any> {

  constructor(props) {
    super(props);

    let weekday = new Date().getDay();
    this.state = { activeDay: dayArray[weekday]}
  }


  render() {
    let iconSize = 0.15*screenHeight;

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return <View />;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rules = stone.rules;

    // TODO: filter days for the rules
    let ruleIds = Object.keys(rules);

    let texts = [];


    ruleIds.forEach((ruleId) => {
      let rule = rules[ruleId];
      let ai;
      if (rule.type === "BEHAVIOUR") {
        ai = new AicoreBehaviour(rule.data);
        texts.push(<Text key={"description" + ruleId} style={{color: "#FFF"}}>{ai.getSentence()}</Text>)
      }
      else if (rule.type === "TWILIGHT") {
        ai = new AicoreTwilight(rule.data);
        texts.push(<Text key={"description" + ruleId} style={{color: "#FFF"}}>{ai.getSentence()}</Text>)
      }
    });

    return (
      <View style={{ width: screenWidth, alignItems:'center' }}>
        <View style={{height: 30}} />
        <Text style={[deviceStyles.header]}>{ "My Behaviour" }</Text>
        <View style={{height: 0.2*iconSize}} />
        <WeekDayList
          data={{
            Mon: this.state.activeDay === "Mon",
            Tue: this.state.activeDay === "Tue",
            Wed: this.state.activeDay === "Wed",
            Thu: this.state.activeDay === "Thu",
            Fri: this.state.activeDay === "Fri",
            Sat: this.state.activeDay === "Sat",
            Sun: this.state.activeDay === "Sun",
          }}
          tight={true}
          darkTheme={true}
          onChange={(day) => {
            if (this.state.activeDay !== "day") {
              this.setState({activeDay:day})
            }
          }}
        />
        <View style={{height: 0.1*iconSize}} />
        <SmartBehaviourSummaryGraph rules={rules} sphereId={this.props.sphereId} />
        {texts}
      </View>
    )
  }
}
