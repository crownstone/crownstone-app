
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_RuleOverview", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  Text, TouchableOpacity,
  View
} from "react-native";


import { availableModalHeight, colors, deviceStyles, screenHeight, screenWidth } from "../../../styles";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { core } from "../../../../core";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { LiveComponent } from "../../../LiveComponent";
import { SlideFadeInView, SlideSideFadeInView } from "../../../components/animated/SlideFadeInView";
import { Icon } from "../../../components/Icon";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { BehaviourSuggestion } from "./supportComponents/BehaviourSuggestion";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export class DeviceSmartBehaviour_RuleOverview extends LiveComponent<any, any> {

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

    let ruleIds = Object.keys(rules);

    let ruleComponents = [];
    let activeRules = {};
    let partiallyActiveRuleIdMap = {};

    let previousDay = (dayArray.indexOf(this.state.activeDay) + 6) % 7;


    ruleIds.forEach((ruleId) => {
      let active = rules[ruleId].activeDays[this.state.activeDay];
      let partiallyActive = !active && rules[ruleId].activeDays[dayArray[previousDay]];


      if (active || partiallyActive) {
        activeRules[ruleId] = rules[ruleId];
        if (partiallyActive) {
          partiallyActiveRuleIdMap[ruleId] = true;
        }
        ruleComponents.push(<SmartBehaviourRule
          key={"description" + ruleId}
          rule={rules[ruleId]}
          sphereId={this.props.sphereId}
          stoneId={this.props.stoneId}
          ruleId={ruleId}
          editMode={this.props.editMode}
          faded={partiallyActive}
        />);
      }
    });

    return (
      <ScrollView>
        <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center' }}>
          <View style={{height: 30}} />
          <Text style={[deviceStyles.header]}>{ lang("My_Behaviour") }</Text>
          <View style={{height: 0.2*iconSize}} />

          <SlideFadeInView visible={!this.props.editMode} height={1.5*(screenWidth/9) + 0.1*iconSize + 90}>
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
              onChange={(fullData, day) => {
                if (this.state.activeDay !== day) {
                  this.setState({activeDay:day})
                }
              }}
            />
            <View style={{height: 0.1*iconSize}} />
            <SmartBehaviourSummaryGraph rules={activeRules} partiallyActiveRuleIdMap={partiallyActiveRuleIdMap} sphereId={this.props.sphereId} />
          </SlideFadeInView>

          <View style={{flex:1}} />
          {ruleComponents}
          <View style={{flex:1}} />
          <SlideFadeInView visible={this.props.editMode} height={80}>
            <BehaviourSuggestion
              label={ lang("Add_more___")}
              callback={() => { NavigationUtil.navigate('DeviceSmartBehaviour_TypeSelector', this.props); }}
            />
          </SlideFadeInView>
          <SlideFadeInView visible={this.props.editMode} height={80}>
            <BehaviourSuggestion
              label={ lang("Copy_from___")}
              callback={() => { NavigationUtil.navigate('DeviceSmartBehaviour_TypeSelector', this.props); }}
              icon={'md-log-in'}
              iconSize={14}
              iconColor={colors.menuTextSelected.rgba(0.75)}
            />
          </SlideFadeInView>
          <SlideFadeInView visible={this.props.editMode} height={80}>
            <BehaviourSuggestion
              label={ lang("Copy_to___")}
              callback={() => { NavigationUtil.navigate('DeviceSmartBehaviour_TypeSelector', this.props); }}
              icon={'md-log-out'}
              iconSize={14}
              iconColor={colors.purple.blend(colors.menuTextSelected, 0.5).rgba(0.75)}
            />
          </SlideFadeInView>
          <View style={{flex:3}} />
        </View>
      </ScrollView>
    )
  }
}


function SmartBehaviourRule(props) {
  let ai;
  if      (props.rule.type === "BEHAVIOUR") { ai = new AicoreBehaviour(props.rule.data); }
  else if (props.rule.type === "TWILIGHT")  { ai = new AicoreTwilight(props.rule.data);  }
  return (
      <View style={{padding:15, flexDirection: 'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
        <SlideSideFadeInView width={50} visible={props.editMode}>
          <TouchableOpacity onPress={() => {
            core.store.dispatch({
              type: "REMOVE_STONE_RULE",
              sphereId: props.sphereId,
              stoneId: props.stoneId,
              ruleId: props.ruleId,
            })
          }} style={{width:50}}>
            <Icon name={'ios-trash'} color={colors.white.rgba(0.6)} size={30} />
          </TouchableOpacity>
        </SlideSideFadeInView>
        <View style={{flex:1}}>
          <Text style={{color: props.faded ? colors.white.rgba(0.4) : colors.white.hex, fontSize:16, textAlign:'center'}}>{ai.getSentence()}</Text>
        </View>
        <SlideSideFadeInView width={50} visible={props.editMode}>
          <TouchableOpacity onPress={() => {
            NavigationUtil.navigate(
            "DeviceSmartBehaviour_Editor",
            {
              data: ai,
              sphereId: props.sphereId,
              stoneId: props.stoneId,
              ruleId: props.ruleId
            });
          }} style={{width:50, alignItems:'flex-end'}}>
            <Icon name={'md-create'} color={colors.white.hex} size={30} />
          </TouchableOpacity>
        </SlideSideFadeInView>
      </View>
  );
}
