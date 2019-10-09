
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_Wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView, Alert
} from "react-native";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth,
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


export class DeviceSmartBehaviour_Wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "When to do this?"});
  }

  rule : AicoreBehaviour | AicoreTwilight;

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

    let { activeDays, conflictDays } = this._getConflictingDays();
    if (this.props.ruleId) {
      let rule = stone.rules[this.props.ruleId];
      if (rule) {
        activeDays = rule.activeDays;
      }
    }

    this.state = { activeDays: activeDays, conflictDays: conflictDays, conflictResolving:false };
  }

  _storeRule() {
    let ruleId = this.props.ruleId || xUtil.getUUID();
    core.store.dispatch({
      type: this.props.ruleId ? "UPDATE_STONE_RULE" : "ADD_STONE_RULE",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      ruleId: ruleId,
      data: {
        type: this.props.twilightRule ? BEHAVIOUR_TYPES.twilight : BEHAVIOUR_TYPES.behaviour,
        data: this.props.rule,
        activeDays: this.state.activeDays,
      }
    });

    return ruleId;
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

    // TODO: handle overlaps

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

    let activeDays   = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
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


  render() {
    let header = "Every day?"
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

    if (this.props.ruleId || amountOfConflictingDays > 0) {
      header = "When do I do this?"
    }

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center', paddingTop:30}}>
            <Text style={[deviceStyles.header, {width: 0.7*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_days_below_to_let") }</Text>

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

            <View style={{flex:1}} />
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
