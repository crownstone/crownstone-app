
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
import { availableModalHeight, colors, deviceStyles, screenHeight, screenWidth } from "../../../styles";
import { SlideFadeInView, SlideSideFadeInView } from "../../../components/animated/SlideFadeInView";
import { WeekDayList } from "../../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { BehaviourSuggestion } from "./supportComponents/BehaviourSuggestion";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Icon } from "../../../components/Icon";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    if (buttonId === 'edit') { this.setState({ editMode: true  }, updateTopBar); }
    if (buttonId === 'save') { this.setState({ editMode: false }, updateTopBar); }
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
  }

  render() {
    let iconSize = 0.15*screenHeight;

    let state = core.store.getState();
    console.log(state, this.props)
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
        ruleComponents.push(<SmartBehaviourRule
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
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center' }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ lang("My_Behaviour") }</Text>
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
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                label={ lang("Add_more___")}
                callback={() => { NavigationUtil.navigate('DeviceSmartBehaviour_TypeSelector', this.props); }}
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



function SmartBehaviourRule(props) {
  let ai;
  if      (props.rule.type === "BEHAVIOUR") { ai = new AicoreBehaviour(props.rule.data); }
  else if (props.rule.type === "TWILIGHT")  { ai = new AicoreTwilight(props.rule.data);  }
  return (
    <View style={{padding:15, flexDirection: 'row', width: screenWidth, alignItems:'center', justifyContent:'center'}}>
      <SlideSideFadeInView width={50} visible={props.editMode}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Are you sure?",
            "I'll delete this rule from the Crownstone as soon as I can. Once that is done it will be removed from the list, until then, it will be crossed through.",
            [{text:"OK", onPress:() => {
                core.store.dispatch({
                  type: "MARK_STONE_RULE_FOR_DELETION",
                  sphereId: props.sphereId,
                  stoneId: props.stoneId,
                  ruleId: props.ruleId,
                });
              }}, {text:"Nope"}])

        }} style={{width:50}}>
          <Icon name={'ios-trash'} color={colors.white.rgba(0.6)} size={30} />
        </TouchableOpacity>
      </SlideSideFadeInView>
      { props.rule.syncedToCrownstone === false ? <ActivityIndicator size={"small"} color={colors.white.hex} /> : undefined }
      <View style={{flex:1}}>
        <Text style={{
          color: props.rule.syncedToCrownstone === false  || props.faded ? colors.white.rgba(0.4) : colors.white.hex,
          fontSize:16,
          textAlign:'center',
          textDecorationLine: props.rule.deleted ? 'line-through' : 'none'
        }}>{ai.getSentence()}</Text>
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



function getTopBarProps(store, state, props, viewState) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  const element = Util.data.getElement(store, props.sphereId, props.stoneId, stone);
  let rulesCreated = Object.keys(stone.rules).length > 0;

  if (viewState.editMode === true) {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      save: true,
      closeModal: true,
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: element.config.name,
      edit: rulesCreated === true ? true : undefined,
      closeModal: true,
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;
