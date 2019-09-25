
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react';
import { DeviceSmartBehaviour_TypeSelector } from "./DeviceSmartBehaviour_TypeSelector";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenHeight,
  screenWidth
} from "../../styles";
import { SlideFadeInView } from "../../components/animated/SlideFadeInView";
import { WeekDayList } from "../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { BehaviourSuggestion } from "./supportComponents/BehaviourSuggestion";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { SmartBehaviourRule } from "./supportComponents/SmartBehaviourRule";
import { BackButtonHandler } from "../../../backgroundProcesses/BackButtonHandler";
import { StoneUtil } from "../../../util/StoneUtil";

let dayArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let className = "DeviceSmartBehaviour";

export class DeviceSmartBehaviour extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(core.store, core.store.getState(), props, {});
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }

  unsubscribeStoreEvents;

  constructor(props) {
    super(props);
    let weekday = new Date().getDay();
    this.state = { editMode: false, activeDay: dayArray[weekday] };
  }


  navigationButtonPressed({ buttonId }) {
    let updateTopBar = () => {
      getTopBarProps(core.store, core.store.getState(), this.props, this.state);
      TopBarUtil.replaceOptions(this.props.componentId, NAVBAR_PARAMS_CACHE)
    }
    if (buttonId === 'edit') {
      this.setState({ editMode: true  }, updateTopBar);
      BackButtonHandler.override(className, () => { this.setState({ editMode: false  }, updateTopBar); })
    }
    if (buttonId === 'closeEdit') {
      BackButtonHandler.clearOverride(className);
      this.setState({ editMode: false  }, updateTopBar); }
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

  copySelectedRulesToStones(stoneIds) {
    let state = core.store.getState();

    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rules = stone.rules;
    let ruleIds = Object.keys(rules);

    stoneIds.forEach((toStoneId) => {
      StoneUtil.copyRulesBetweenStones(this.props.sphereId, this.props.stoneId, toStoneId, ruleIds);
    })
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

    let rulesPresent = ruleIds.length > 0;

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

        let ruleComponent = (
          <SmartBehaviourRule
            key={"description" + ruleId}
            rule={rule}
            sphereId={this.props.sphereId}
            stoneId={this.props.stoneId}
            ruleId={ruleId}
            editMode={this.state.editMode}
            faded={partiallyActive}
          />
        );

        ruleComponents.push(ruleComponent);
      }
    });

    let headerText = lang("My_Behaviour", stone.config.name);

    return (
      <Background image={core.background.lightBlurLighter} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ headerText }</Text>
            <View style={{height: 0.2*iconSize}} />
            <SlideFadeInView visible={!this.state.editMode && rulesPresent} height={1.5*(screenWidth/9) + 0.1*iconSize + 90}>
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
            <View style={{flex:2}} />
            <SlideFadeInView visible={this.state.editMode || !rulesPresent} height={80}>
              <BehaviourSuggestion
                label={ lang("Add_more___")}
                callback={() => { NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', this.props); }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode || !rulesPresent} height={80}>
              <BehaviourSuggestion
                label={ lang("Copy_from___")}
                callback={() => {
                  let copyFrom = () => {
                    NavigationUtil.navigate("DeviceSmartBehaviour_CopyStoneSelection", {
                      sphereId: this.props.sphereId,
                      stoneId: this.props.stoneId,
                      copyType: "FROM",
                      originId: this.props.stoneId,
                      callback: (fromStoneId, selectedRuleIds) => {
                        StoneUtil.copyRulesBetweenStones(this.props.sphereId, fromStoneId, this.props.stoneId, selectedRuleIds)
                          .then((success) => {
                            if (success) {
                              NavigationUtil.back()
                            }
                          })
                      }
                    });
                  }

                  if (ruleIds.length > 0) {
                    Alert.alert(
                      "Copying will override existing Behaviour",
                      "If you copy behaviour from another Crownstone, it's behaviour will replace the current behaviour. Do you want to continue?",
                      [{text:"Nevermind"}, {text:"Yes", onPress: copyFrom}])
                  }
                  else{
                    copyFrom()
                  }
                }}
                icon={'md-log-in'}
                iconSize={14}
                iconColor={colors.menuTextSelected.rgba(0.75)}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                label={ lang("Copy_to___")}
                callback={() => {
                  let requireDimming = StoneUtil.doRulesRequireDimming(this.props.sphereId, this.props.stoneId, ruleIds);

                  NavigationUtil.navigate('DeviceSmartBehaviour_CopyStoneSelection', {
                    sphereId: this.props.sphereId,
                    stoneId: this.props.stoneId,
                    copyType: "TO",
                    originId: this.props.stoneId,
                    rulesRequireDimming: requireDimming,
                    callback:(stoneIds) => {
                      this.copySelectedRulesToStones(stoneIds);
                      Alert.alert("Success!", "Behaviour has been copied!", [{text:"Great!", onPress:() => { NavigationUtil.back();}}], {onDismiss: () => { NavigationUtil.back();}})
                    }});
                }}
                icon={'md-log-out'}
                iconSize={14}
                iconColor={colors.purple.blend(colors.menuTextSelected, 0.5).rgba(0.75)}
              />
            </SlideFadeInView>
            { !rulesPresent && <View style={{flex:4}} /> }
            <View style={{height:30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}



function getTopBarProps(store, state, props, viewState) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];

  if (viewState.editMode === true) {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      leftText: {id:'closeEdit', text:'Back'},
    };
  }
  else {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      edit: true,
      closeModal: true,
    };
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;