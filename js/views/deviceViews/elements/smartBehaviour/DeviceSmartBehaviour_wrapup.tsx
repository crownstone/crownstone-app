
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_wrapup", key)(a,b,c,d,e);
}
import { LiveComponent }          from "../../../LiveComponent";
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
} from "../../../styles";
import { core } from "../../../../core";
import { Background } from "../../../components/Background";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { WeekDayList } from "../../../components/WeekDayList";
import { TopBarUtil } from "../../../../util/TopBarUtil";
import { xUtil } from "../../../../util/StandAloneUtil";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";


export class DeviceSmartBehaviour_wrapup extends LiveComponent<{sphereId: string, stoneId: string, rule: string, twilightRule: boolean, ruleId?: string}, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("When_")});
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
      this.rule = new AicoreTwilight(this.props.rule);
    }
    else {
      // @ts-ignore
      this.rule = new AicoreBehaviour(this.props.rule);
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

  render() {
    let header = "Every day?"
    if (this.props.ruleId) {
      header = "When do I do this?"
    }

    return (
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView style={{width: screenWidth}}>
          <View style={{flex:1, width: screenWidth, minHeight:availableModalHeight, alignItems:'center'}}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ header }</Text>
            <View style={{height: 0.02*availableModalHeight}} />
            <Text style={deviceStyles.specification}>{ lang("Tap_the_days_below_to_let") }</Text>

            <View style={{flex:1}} />
            <WeekDayList
              data={this.state.activeDays}
              tight={true}
              darkTheme={false}
              onChange={(fullData, day) => { this.setState({activeDays: fullData}); }}
            />

            <View style={{flex:1}} />
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
                  Alert.alert(
                    lang("_Never___Please_pick_at_l_header"),
                    lang("_Never___Please_pick_at_l_body"),
                    [{text:lang("_Never___Please_pick_at_l_left")}])
                  return;
                }

                this._storeRule();

                NavigationUtil.backTo("DeviceSmartBehaviour")
              }} style={{
                width:0.5*screenWidth, height:60, borderRadius:20,
                backgroundColor: colors.green.hex, alignItems:'center', justifyContent: 'center'
              }}>
                <Text style={{fontSize:16, fontWeight:'bold'}}>{ lang("Thats_it_") }</Text>
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
