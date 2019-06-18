import { LiveComponent }          from "../../../../LiveComponent";
import * as React from 'react';
import {
  Animated,
  TouchableOpacity,
  Text,
  View, TextStyle, ViewStyle, ScrollView, Alert
} from "react-native";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth,
} from "../../../../styles";
import { core } from "../../../../../core";
import { Background } from "../../../../components/Background";
import { NavigationUtil } from "../../../../../util/NavigationUtil";
import { WeekDayList } from "../../../../components/WeekDayList";
import { TopBarUtil } from "../../../../../util/TopBarUtil";
import { xUtil } from "../../../../../util/StandAloneUtil";
import { AicoreBehaviour } from "../supportCode/AicoreBehaviour";
import { AicoreTwilight } from "../supportCode/AicoreTwilight";


export class DeviceSmartBehaviour_wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "When?" });
  }

  rule : AicoreBehaviour | AicoreTwilight;

  constructor(props) {
    super(props);

    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    if (!sphere) return;
    let stone = sphere.stones[this.props.stoneId];
    if (!stone) return;

    let activeDays = { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true };
    if (this.props.ruleId) {
      let rule = stone.rules[this.props.ruleId];
      if (rule) {
        activeDays = rule.activeDays;
      }
    }

    this.state = { activeDays: activeDays };

    if (this.props.twilightRule) {
      // @ts-ignore
      this.rule = new AicoreTwilight(this.props.data);
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.data);
    }
  }

  _storeRule() {
    let ruleId = this.props.ruleId || xUtil.getUUID();
    core.store.dispatch({
      type: this.props.ruleId ? "UPDATE_STONE_RULE" : "ADD_STONE_RULE",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      ruleId: ruleId,
      data: {
        type: "BEHAVIOUR",
        data: this.props.rule,
        activeDays: this.state.activeDays,
        syncedToCrownstone: false
      }
    });

    return ruleId;
  }

  getOptionContext() {
    if (!this.rule.hasNoOptions()) {
      let optionData = [];
      // @ts-ignore
      if (this.rule.rule.options.type === "SPHERE_PRESENCE_AFTER") {
        return (
          <Text style={deviceStyles.specification}>{
            "I won't turn off as long as someone is home. This is done by automatically another rule that will keep me on for you. This will last until sunrise, give it a try!"
          }</Text>
        );
      }
      else {
        // in room
        return (
          <Text style={deviceStyles.specification}>{
            "I won't turn off as long as someone is in the room. This is done by automatically another rule that will keep me on for you. This will last until sunrise, give it a try!"
          }</Text>
        );
      }
    }
    console.log(this.rule)
    return (
      <Text style={deviceStyles.specification}>{
        "no mas..."
      }</Text>
    );
  }

  render() {
    let header = "Every day?"
    if (this.props.ruleId) {
      header = "When do I do this?"
    }

    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{
              "Tap the days below to let me know when I should act on this behaviour!\n\n" +
              "If a behaviour is started on an active day, it will not just stop at midnight but logically finish up."
            }</Text>

            <View style={{flex:1}} />
            <WeekDayList
              data={this.state.activeDays}
              tight={true}
              darkTheme={true}
              onChange={(fullData, day) => { this.setState({activeDays: fullData}); }}
            />
            <View style={{flex:1}} />

            { this.getOptionContext() }

            <View style={{flexDirection:'row'}}>
              <View style={{flex:1}} />
              <TouchableOpacity onPress={() => {
                let days = Object.keys(this.state.activeDays);
                let atleastOneDay = false;
                for (let i = 0; i < days.length; i++) {
                  if (this.state.activeDays[days[i]] === true) {
                    atleastOneDay = true;
                    break;
                  }
                }

                if (!atleastOneDay) {
                  Alert.alert("Never?", "Please pick at least 1 day for this behaviour!", [{text:"OK"}])
                  return;
                }

                this._storeRule();

                NavigationUtil.backTo("DeviceSmartBehaviour")
              }} style={{
                width:0.5*screenWidth, height:60, borderRadius:20,
                backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
              }}>
                <Text style={{fontSize:16, fontWeight:'bold'}}>{ "That's it!" }</Text>
              </TouchableOpacity>
              <View style={{flex:1}} />
            </View>
            <View style={{height: 30}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}
