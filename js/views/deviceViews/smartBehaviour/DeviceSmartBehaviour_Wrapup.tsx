
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView, Alert, TextStyle
} from "react-native";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth, styles
} from "../../styles";
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { NavigationUtil, NavState } from "../../../util/NavigationUtil";
import { LargeWeekdayElement, WeekDayList, WeekDayListLarge } from "../../components/WeekDayList";
import { xUtil } from "../../../util/StandAloneUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";
import { Icon } from "../../components/Icon";
import { BehaviourSubmitButton } from "./supportComponents/BehaviourSubmitButton";
import { BEHAVIOUR_TYPES } from "../../../router/store/reducers/stoneSubReducers/rules";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { AicoreUtil } from "./supportCode/AicoreUtil";
import { DAY_INDICES_MONDAY_START, DAY_LABEL_MAP, DAY_SHORT_LABEL_MAP } from "../../../Constants";
import { SlideFadeInView, SlideSideFadeInView } from "../../components/animated/SlideFadeInView";


export class DeviceSmartBehaviour_Wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string, selectedDay?: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "When to do this?"});
  }

  rule : AicoreBehaviour | AicoreTwilight;
  ruleHasChanged = true;
  existingRule : AicoreBehaviour | AicoreTwilight = null;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;

    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule = new AicoreTwilight(this.props.rule);
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.rule);
    }

    let rule = stone.rules[this.props.ruleId];

    // we want to catch the case where the rule was not changed, even though the used pressed edit.
    if (this.props.twilightRule) {
      // @ts-ignore
      this.existingRule = new AicoreTwilight(rule.data);
    }
    else {
      // @ts-ignore
      this.existingRule = new AicoreBehaviour(rule.data);
    }

    if (this.rule.isTheSameAs(this.existingRule) === true) {
      this.ruleHasChanged = false;
    }


    let { activeDays, conflictDays } = this._getConflictingDays();
    if (this.props.ruleId && this.ruleHasChanged === false) {
      let rule = stone.rules[this.props.ruleId];
      if (rule) {
        activeDays = rule.activeDays;
      }
    }

    this.state = { activeDays: activeDays, conflictDays: conflictDays, conflictResolving:false };
  }

  _storeRule() {
    let mergedId = null;
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;
    let rules = stone.rules;
    let ruleIds = Object.keys(rules);


    let actions = [];

    // define two util functions that take care of sorting out days. We will use them later on.
    let removeActiveDaysFromRule = (rule, ruleId) => {
      // disable the selected days for the previous rule
      let newActiveDaysForRule = {...rule.activeDays};
      Object.keys(this.state.activeDays).forEach((day) => {
        if (this.state.activeDays[day]) {
          newActiveDaysForRule[day] = false;
        }
      })

      updateRuleWithNewActiveDays(newActiveDaysForRule, ruleId);
    }
    let updateRuleWithNewActiveDays = (activeDays, ruleId) => {
      // check if there are any days left for the original rule
      let activeDayCount = 0;
      for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
        if (activeDays[DAY_INDICES_MONDAY_START[i]]) {
          activeDayCount++;
        }
      }

      if (activeDayCount > 0) {
        actions.push({type:"UPDATE_STONE_RULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, ruleId: ruleId, data: {activeDays: activeDays}});
      }
      else {
        actions.push({type:"MARK_STONE_RULE_FOR_DELETION", sphereId: this.props.sphereId, stoneId: this.props.stoneId, ruleId: ruleId});
      }
    }


    // if we have an existing rule, we have to update it.
    if (this.props.ruleId) {

      // if the existing rule has been changed, we make a new one and update the old one to not be active on the selected days.
      if (this.ruleHasChanged) {
        // search for behaviour that is the same as the behaviour to see if we can merge them.
        for (let i = 0; i < ruleIds.length; i++) {
          if (ruleIds[i] !== this.props.ruleId) {
            if (this.rule.isTheSameAs(rules[ruleIds[i]].data)) {
              mergedId = ruleIds[i];
              let newActiveDaysForMergeRule = {...rules[ruleIds[i]].activeDays};
              Object.keys(this.state.activeDays).forEach((day) => {
                if (this.state.activeDays[day]) {
                  newActiveDaysForMergeRule[day] = true;
                }
              })
              actions.push({type:"UPDATE_STONE_RULE", sphereId: this.props.sphereId, stoneId: this.props.stoneId, ruleId: mergedId, data: {activeDays: newActiveDaysForMergeRule}});
              break;
            }
          }
        }

        // we could not find a behaviour to merge with, we will make a new behaviour.
        if (!mergedId) {
          let newRuleId = xUtil.getUUID();
          actions.push({
            type: "ADD_STONE_RULE",
            sphereId: this.props.sphereId,
            stoneId: this.props.stoneId,
            ruleId: newRuleId,
            data: {
              type: this.props.twilightRule ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
              data: this.rule.stringify(),
              activeDays: this.state.activeDays,
            }
          });
        }

        removeActiveDaysFromRule(rules[this.props.ruleId], this.props.ruleId)
      }
      else {
        // if the rule has not been changed, the active days have been changed.
        updateRuleWithNewActiveDays(this.state.activeDays, this.props.ruleId);
      }
    }


    // for all conflicting days, disable the conflicting rules unless they are the merged rules.
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      if (this.state.activeDays[day]) {
        if (this.state.conflictDays[day].conflict) {
          let conflictingRules = this.state.conflictDays[day].rules;
          conflictingRules.forEach((conflictRuleData) => {
            if (conflictRuleData.ruleId !== mergedId) {
              removeActiveDaysFromRule(rules[conflictRuleData.ruleId], conflictRuleData.ruleId)
            }
          })
        }
      }
    }

    core.store.batchDispatch(actions);
  }

  getOptionContext() {
    if (!this.rule.hasNoOptions()) {
      // @ts-ignore
      if (this.rule.rule.options.type === "SPHERE_PRESENCE_AFTER") {
        return (
          <Text style={deviceStyles.specification}>{ lang("After_this_behaviour__I_w") }</Text>
        );
      }
      else {
        // in room
        return (
          <Text style={deviceStyles.specification}>{ lang("I_wont_turn_off_as_long_a") }</Text>
        );
      }
    }
  }

  submit() {
    let days = Object.keys(this.state.activeDays);
    let atleastOneDay = false;
    for (let i = 0; i < days.length; i++) {
      if (this.state.activeDays[days[i]] === true) {
        atleastOneDay = true;
        break;
      }
    }

    if (!atleastOneDay) {
      Alert.alert(
        lang("_Never___Please_pick_at_l_header"),
        lang("_Never___Please_pick_at_l_body"),
        [{text:lang("_Never___Please_pick_at_l_left")}])
      return;
    }

    this._storeRule();

    NavigationUtil.dismissModal();
  }


  _getConflictingDays() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    let ruleIds = Object.keys(stone.rules);

    let activeDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };

    if (this.props.ruleId) {
      activeDays = { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false };
      activeDays[this.props.selectedDay] = true;
    }

    let conflictDays = {
      Mon: {rules: [], conflict:false },
      Tue: {rules: [], conflict:false },
      Wed: {rules: [], conflict:false },
      Thu: {rules: [], conflict:false },
      Fri: {rules: [], conflict:false },
      Sat: {rules: [], conflict:false },
      Sun: {rules: [], conflict:false }
    };

    let newRule = {type: this.props.twilightRule ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour, data: this.rule}
    let newSummary = AicoreUtil.getBehaviourSummary(newRule);
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      for (let j = 0; j < ruleIds.length; j++) {
        let ruleId = ruleIds[j];
        let rule = stone.rules[ruleId];
        if (ruleId !== this.props.ruleId) {
          if (newRule.type !== rule.type) { continue; }
          if (this.rule.isTheSameAs(stone.rules[ruleIds[i]])) { continue; }

          let data = AicoreUtil.getOverlapData(newRule, rule, day, this.props.sphereId);
          if (data.overlapMins === 0) { continue; }
          if (data.aPercentageOverlapped < 0.4 && data.bPercentageOverlapped < 0.4) { continue; } // no hassle

          let existingSummary = AicoreUtil.getBehaviourSummary(rule);

          let isConflicting = false;
          isConflicting = isConflicting || newSummary.usingSingleRoomPresence && existingSummary.usingSingleRoomPresence;
          isConflicting = isConflicting || newSummary.usingMultiRoomPresence  && existingSummary.usingMultiRoomPresence;
          isConflicting = isConflicting || newSummary.usingSpherePresence     && existingSummary.usingSpherePresence;

          if (isConflicting) {
            // just not make this directly selected
            if (data.aPercentageOverlapped <= 0.3 && data.bPercentageOverlapped <= 0.3) {
              // fine.... ignore it.
              continue;
            }
            if ((data.aPercentageOverlapped <= 0.5 && data.bPercentageOverlapped <= 0.5) && (data.aPercentageOverlapped > 0.3 || data.bPercentageOverlapped > 0.3)) {
              activeDays[day] = false; continue;
            }

            // A is in B and B is significantly overlapped
            if (data.aPercentageOverlapped > 0.5 && data.bPercentageOverlapped > 0.5) {
              // replace
              conflictDays[day].conflict = true;
              conflictDays[day].rules.push({ruleId: ruleId, label: existingSummary.label});
              activeDays[day] = false; continue;
            }
          }
        }
      }
    }

    return {activeDays, conflictDays};
  }


  _getRuleComparison() {
    let ruleStyle : TextStyle = {
      fontSize: 15,
      padding:10,
      fontWeight:'bold',
      fontStyle:'italic',
      paddingHorizontal: 20,
      textAlign:'center'
    };
    return (
      <View style={styles.centered}>
        <Text style={ruleStyle}>{'"' + this.existingRule.getSentence() + '"'}</Text>
        <Icon name={'ios-arrow-down'} size={10} color={colors.csBlueDark.hex} />
        <Icon name={'ios-arrow-down'} size={20} color={colors.csBlueDark.hex} />
        <Text style={ruleStyle}>{'"' + this.rule.getSentence() + '"'}</Text>
      </View>
    )
  }

  render() {
    let header = "Every day?";
    let headerNumberOfLines = 1;
    let body = lang("Tap_the_days_below_to_let");
    let amountOfUnresolvedConflictingDays = 0;
    let amountOfConflictingDays = 0;
    for (let i = 0; i < DAY_INDICES_MONDAY_START.length; i++) {
      let day = DAY_INDICES_MONDAY_START[i];
      if (this.state.conflictDays[day].conflict) {
        amountOfConflictingDays += 1;
        if (!this.state.conflictDays[day].resolved) {
          amountOfUnresolvedConflictingDays += 1;
        }
      }
    }
    if (amountOfConflictingDays > 0) {
      header = "When do I do this?"

    }

    // if we have a rule ID, this is an edit operation, not a new rule
    // there will be a separate header, body text and selection.
    // Conflict resolution is done based on other rules than the existing rule.
    if (this.props.ruleId && this.ruleHasChanged) {
      headerNumberOfLines = 2;
      header = "When shall I use the modified behaviour?";
      body = "You can quickly apply your changes to multiple days!";
    }

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center', paddingTop:30}}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={headerNumberOfLines} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />

            { this.props.ruleId && this.ruleHasChanged && this._getRuleComparison() }

            <Text style={deviceStyles.specification}>{ body }</Text>

            <View style={{flex:1}} />

            <View style={{width:screenWidth, flexDirection:'row'}}>
              <SlideSideFadeInView visible={this.state.conflictResolving === false} width={screenWidth}>
                <WeekDayListLarge
                  data={this.state.activeDays}
                  conflictDays={this.state.conflictDays}
                  tight={true}
                  onChange={(fullData, day) => {
                    if (fullData[day] === true) {
                      if (this.state.conflictDays[day].conflict) {
                        let ruleList = this.state.conflictDays[day].rules[0].label;
                        for (let j = 1; j < this.state.conflictDays[day].rules.length; j++) {
                          ruleList += "\n" + this.state.conflictDays[day].rules[j].label;
                        }
                        Alert.alert("This will replace the following behaviours on " + DAY_LABEL_MAP[day] + ":", ruleList, [{ text: "Cancel" }, {
                          text: "OK", onPress: () => {
                            this.setState({ activeDays: fullData })
                          }
                        }]);
                        return;
                      }
                    }
                    this.setState({ activeDays: fullData });
                  }}
                />
              </SlideSideFadeInView>
            </View>

            <View style={{flex:2}} />
            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <View>
              <BehaviourSubmitButton callback={() => { this.submit() }} label={lang("Thats_it_")} />
              </View>
              <View style={{flex:1}} />
            </View>
            <View style={{height: 30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}
