
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
  screenWidth, styles
} from "../../styles";
import { SlideFadeInView } from "../../components/animated/SlideFadeInView";
import { WeekDayList } from "../../components/WeekDayList";
import { SmartBehaviourSummaryGraph } from "./supportComponents/SmartBehaviourSummaryGraph";
import { BehaviourSuggestion } from "./supportComponents/BehaviourSuggestion";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { SmartBehaviourRule } from "./supportComponents/SmartBehaviourRule";
import { BackButtonHandler } from "../../../backgroundProcesses/BackButtonHandler";
import { StoneUtil } from "../../../util/StoneUtil";
import { ScaledImage } from "../../components/ScaledImage";
import { DataUtil } from "../../../util/DataUtil";
import { AicoreUtil } from "./supportCode/AicoreUtil";
import { DAY_INDICES_SUNDAY_START } from "../../../Constants";


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
    this.state = { editMode: false, activeDay: DAY_INDICES_SUNDAY_START[weekday] };
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
    // core.store.dispatch({type:"REMOVE_ALL_RULES_OF_STONE", sphereId: this.props.sphereId, stoneId: this.props.stoneId})

    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.stoneChangeRules) {
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

    let ruleComponents = [];
    let activeRules = {};
    let activityMap = {};

    let previousDay = (DAY_INDICES_SUNDAY_START.indexOf(this.state.activeDay) + 6) % 7;

    let hasRules = ruleIds.length;

    if (!hasRules && !this.state.editMode) {
      return <NoRulesYet sphereId={this.props.sphereId} stoneId={this.props.stoneId} />;
    }

    ruleIds.sort((a,b) => {
      let aIsYesterday = !rules[a].activeDays[this.state.activeDay] && rules[a].activeDays[DAY_INDICES_SUNDAY_START[previousDay]];
      if (aIsYesterday) { return -1; }
      let bIsYesterday = !rules[b].activeDays[this.state.activeDay] && rules[b].activeDays[DAY_INDICES_SUNDAY_START[previousDay]];
      if (bIsYesterday) { return 1; }

      if (AicoreUtil.aStartsBeforeB(rules[a], rules[b], this.props.sphereId)) {
        return -1;
      }
      return 1;


    })

    ruleIds.forEach((ruleId) => {
      let active = rules[ruleId].activeDays[this.state.activeDay];
      let partiallyActive = !active && rules[ruleId].activeDays[DAY_INDICES_SUNDAY_START[previousDay]];

      if (active || (partiallyActive && !this.state.editMode)) {
        let rule = rules[ruleId];
        activeRules[ruleId] = rules[ruleId];
        activityMap[ruleId] = {
          yesterday: rules[ruleId].activeDays[DAY_INDICES_SUNDAY_START[previousDay]],
          today:     rules[ruleId].activeDays[this.state.activeDay],
        };

        let ruleComponent = (
          <SmartBehaviourRule
            key={"description" + ruleId}
            rule={rule}
            sphereId={this.props.sphereId}
            stoneId={this.props.stoneId}
            activeDay={this.state.activeDay}
            startedYesterday={!rules[ruleId].activeDays[this.state.activeDay] && rules[ruleId].activeDays[DAY_INDICES_SUNDAY_START[previousDay]]}
            ruleId={ruleId}
            editMode={this.state.editMode}
            faded={partiallyActive}
          />
        );

        ruleComponents.push(ruleComponent);
      }
    });


    return (
      <Background image={core.background.lightBlurLighter} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ lang("My_Behaviour", stone.config.name) }</Text>
            <View style={{height: 0.2*iconSize}} />
            <SlideFadeInView visible={true} height={1.5*(screenWidth/9)}>
              <WeekDayList
                data={{
                  Mon: this.state.activeDay === DAY_INDICES_SUNDAY_START[1],
                  Tue: this.state.activeDay === DAY_INDICES_SUNDAY_START[2],
                  Wed: this.state.activeDay === DAY_INDICES_SUNDAY_START[3],
                  Thu: this.state.activeDay === DAY_INDICES_SUNDAY_START[4],
                  Fri: this.state.activeDay === DAY_INDICES_SUNDAY_START[5],
                  Sat: this.state.activeDay === DAY_INDICES_SUNDAY_START[6],
                  Sun: this.state.activeDay === DAY_INDICES_SUNDAY_START[0],
                }}
                tight={true}
                darkTheme={false}
                onChange={(fullData, day) => {
                  if (this.state.activeDay !== day) {
                    this.setState({activeDay:day})
                  }
                }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={!this.state.editMode} height={0.1*iconSize + 90}>
              <View style={{height: 0.1*iconSize}} />
              <SmartBehaviourSummaryGraph rules={activeRules} activityMap={activityMap} sphereId={this.props.sphereId} />
            </SlideFadeInView>

            <View style={{flex:1}} />
            {ruleComponents}
            <View style={{flex:2}} />

            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                backgroundColor={colors.menuTextSelected.rgba(0.5)}
                label={ lang("Add_more___")}
                callback={() => { NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', this.props); }}
              />
            </SlideFadeInView>
            <SlideFadeInView visible={this.state.editMode} height={80}>
              <BehaviourSuggestion
                backgroundColor={colors.menuTextSelected.rgba(0.5)}
                label={ lang("Copy_from___")}
                callback={() => {
                  let copyFrom = () => {
                    NavigationUtil.navigate("DeviceSmartBehaviour_CopyStoneSelection", {
                      sphereId: this.props.sphereId,
                      stoneId: this.props.stoneId,
                      copyType: "FROM",
                      originId: this.props.stoneId,
                      callback: (fromStoneId, selectedRuleIds) => {
                        let stoneName = DataUtil.getStoneName(this.props.sphereId, fromStoneId);
                        Alert.alert(
                          "Shall I copy the behaviour from " + stoneName + "?",
                          undefined,
                          [{text:"Cancel"}, {text:"OK", onPress:() => {
                              StoneUtil.copyRulesBetweenStones(this.props.sphereId, fromStoneId, this.props.stoneId, selectedRuleIds)
                                .then((success) => {
                                  if (success) {
                                    BehaviourCopySuccessPopup();
                                  }
                                })
                        }}])
                      }
                    });
                  }

                  if (ruleIds.length > 0) {
                    Alert.alert(
                      "Copying will override existing Behaviour",
                      "If you copy behaviour from another Crownstone, it's behaviour will replace the current behaviour. Do you want to continue?",
                      [{text:"Never mind"}, {text:"Yes", onPress: copyFrom}])
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
                backgroundColor={colors.menuTextSelected.rgba(0.5)}
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
                      BehaviourCopySuccessPopup();
                    }});
                }}
                icon={'md-log-out'}
                iconSize={14}
                iconColor={colors.purple.blend(colors.menuTextSelected, 0.5).rgba(0.75)}
              />
            </SlideFadeInView>
            <View style={{height:30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}

function NoRulesYet(props) {
  let state = core.store.getState();
  let sphere = state.spheres[props.sphereId];
  if (!sphere) return <View />;
  let stone = sphere.stones[props.stoneId];
  if (!stone) return <View />;

  return (
    <Background image={core.background.lightBlurLighter} hasNavBar={false}>
      <ScrollView>
        <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
          <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ "What is Behaviour?" }</Text>
          <View style={{height: 40}} />
          <View style={{flexDirection:'row', width: screenWidth, alignItems:'center', justifyContent: 'space-evenly'}}>
            <ScaledImage source={require('../../../images/overlayCircles/dimmingCircleGreen.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
            <ScaledImage source={require('../../../images/overlayCircles/roomsCircle.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
            <ScaledImage source={require('../../../images/overlayCircles/time.png')} sourceWidth={600} sourceHeight={600} targetWidth={0.27*screenWidth} />
          </View>
          <View style={{height: 40}} />
          <Text style={styles.boldExplanation}>{ "My behaviour is a combination of presence awareness, a schedule and responding to your actions." }</Text>
          <Text style={styles.explanation}>{ "I can take multiple people in your household into account, or I could turn a light on at 50% when you use your wall switches after dark." }</Text>
          <Text style={styles.explanation}>{ "Tap the Add button below to get started or copy the behaviour from another Crownstone!" }</Text>
          <View style={{flex:1, minHeight: 40}} />
          <BehaviourSuggestion
            backgroundColor={colors.green.rgba(0.9)}
            label={ "Add my first behaviour!"}
            callback={() => { NavigationUtil.launchModal('DeviceSmartBehaviour_TypeSelector', {sphereId: props.sphereId, stoneId: props.stoneId}); }}
          />
          <BehaviourSuggestion
            backgroundColor={colors.menuTextSelected.rgba(0.6)}
            label={ "Copy from another Crownstone!"}
            icon={'md-log-in'}
            iconSize={14}
            iconColor={colors.menuTextSelected.rgba(0.75)}
            callback={() => {
              NavigationUtil.launchModal("DeviceSmartBehaviour_CopyStoneSelection",{
                ...props,
                copyType: "FROM",
                originId: props.stoneId,
                originIsDimmable: stone.abilities.dimming.enabledTarget,
                callback:(fromStoneId, selectedRuleIds) => {
                  let stoneName = DataUtil.getStoneName(props.sphereId, fromStoneId);
                  Alert.alert(
                    "Shall I copy the behaviour from " + stoneName + "?",
                    undefined,
                    [{text:"Cancel"}, {text:"OK", onPress:() => {
                        StoneUtil.copyRulesBetweenStones(props.sphereId, fromStoneId, props.stoneId, selectedRuleIds)
                          .then((success) => {
                            if (success) {
                              let seeResults = () => {
                                NavigationUtil.dismissModal();
                              }
                              Alert.alert(
                                "Success!",
                                "Behaviour has been copied!",
                                [{text:"Great!", onPress:() => { seeResults() }}], {onDismiss: () => { seeResults() }})
                            }
                          })
                      }}])
                },
              })
            }}
          />
          <View style={{height:30}} />
        </View>
      </ScrollView>
    </Background>
  )
}



export const BehaviourCopySuccessPopup = function() {
  Alert.alert("Success!", "Behaviour has been copied!", [{text:"Great!", onPress:() => { NavigationUtil.back();}}], {onDismiss: () => { NavigationUtil.back();}})
}


function getTopBarProps(store, state, props, viewState) {
  const stone = state.spheres[props.sphereId].stones[props.stoneId];
  if (Object.keys(stone.rules).length === 0 && viewState.editMode !== true) {
    NAVBAR_PARAMS_CACHE = {
      title: stone.config.name,
      closeModal: true,
    };
    return NAVBAR_PARAMS_CACHE;
  }


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