
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { DeviceSmartBehaviour_TypeSelector } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../../core";
import { Background } from "../../../components/Background";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { Util } from "../../../../util/Util";
import { LiveComponent } from "../../../LiveComponent";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenHeight,
  screenWidth
} from "../../../styles";
import { SlideFadeInView, SlideSideFadeInView } from "../../../components/animated/SlideFadeInView";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { BehaviourSuggestion } from "./supportComponents/BehaviourSuggestion";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { SmartBehaviourRule } from "./supportComponents/SmartBehaviourRule";
import { BackButtonHandler } from "../../../../backgroundProcesses/BackButtonHandler";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let className = "DeviceSmartBehaviour";

export class DeviceSmartBehaviour extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store, core.store.getState(), props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(core.store, core.store.getState(), this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') {
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => { this.setState({ editMode: true  }, updateTopBar);})
    }
    if (buttonId === 'closeEdit') { this.setState({ editMode: false  }, updateTopBar); }
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);

    let weekday = new Date().getDay();
    this.state = { editMode: false, activeDay: dayArray[weekday] }
  }

  componentDidMount(): void {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.stoneChangeRules
      ) {
        getTopBarProps(core.store, core.store.getState(), this.props, this.state);
        TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeStoreEvents();
    BackButtonHandler.clearOverride(className);
  }

  render() {
    let iconSize = 0.15*screenHeight;

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return <View />;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return <View />;
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
        let rule = rules[ruleId];
        activeRules[ruleId] = rules[ruleId];
        if (partiallyActive) {
          partiallyActiveRuleIdMap[ruleId] = true;
        }
        ruleComponents.push(
        <SmartBehaviourRule
          key={"description" + ruleId}
          rule={rule}
          sphereId={this.props.sphereId}
          stoneId={this.props.stoneId}
          ruleId={ruleId}
          editMode={this.state.editMode}
          faded={partiallyActive}
        />);
      }
    });

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ lang("My_Behaviour", stone.config.name) }</Text>
            <View style={{height: 0.2*iconSize}} />

            <SlideFadeInView visible={!this.state.editMode} height={1.5*(screenWidth/9) + 0.1*iconSize + 90}>
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
                darkTheme={false}
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
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                label={ lang("Add_more___")}
                callback={() => { NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', this.props); }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                label={ lang("Copy_from___")}
                callback={() => { NavigationUtil.navigate('DeviceSmartBehaviour_TypeSelector', this.props); }}
                icon={'md-log-in'}
                iconSize={14}
                iconColor={colors.menuTextSelected.rgba(0.75)}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
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
      </Background>
    )
  }
}



function getTopBarProps(store, state, props, viewState) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  let rulesCreated = Object.keys(stone.rules).length > 0;

  if (viewState.editMode === true) {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      leftText: {id:'closeEdit', text:'Back'},
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      edit: rulesCreated === true ? true : undefined,
      closeModal: true,
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;